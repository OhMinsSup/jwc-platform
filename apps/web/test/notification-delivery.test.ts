import { deriveDataKeys, encryptJson } from "@jwc/common/crypto";
import { bytesToBase64 } from "@jwc/common/encoding";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { deliverSms } from "../src/features/submissions/server/notify";
import type {
	findMessageByKey,
	recordDelivery,
} from "../src/features/submissions/server/submission-keys-repository";

const { findMessage, record, send, keys } = vi.hoisted(() => ({
	findMessage: vi.fn<typeof findMessageByKey>().mockResolvedValue(undefined),
	record: vi.fn<typeof recordDelivery>().mockResolvedValue(undefined),
	send: vi
		.fn<(to: string, text: string) => Promise<{ messageId: string }>>()
		.mockResolvedValue({ messageId: "fake-message" }),
	keys: vi.fn<() => ReturnType<typeof deriveDataKeys>>(),
}));
vi.mock(import("void/queues"), () => ({
	queues: {
		sms: {
			send: vi.fn<Queue["send"]>(),
			sendBatch: vi.fn<Queue["sendBatch"]>(),
			metrics: vi.fn<Queue["metrics"]>(),
		},
	},
}));
vi.mock(import("../src/platform/server/log"), () => ({
	log: {
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>(),
	},
}));
vi.mock(import("../src/platform/server/runtime"), () => ({
	dataKeys: keys,
	smsMode: () => "log",
	smsSender: () => ({ send }),
	submissionLink: () => "https://example.test/r/sub_1",
}));
vi.mock(
	import("../src/features/submissions/server/submission-keys-repository"),
	() => ({ findMessageByKey: findMessage, recordDelivery: record }),
);

const NOW = Date.UTC(2026, 10, 6);
const QUEUED = {
	submissionId: "sub_1",
	idempotencyKey: "sub_1:onCreate:1",
	payload: "not-an-encrypted-payload",
};

describe(deliverSms, () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		findMessage.mockResolvedValue(undefined);
		keys.mockResolvedValue(
			await deriveDataKeys(bytesToBase64(new Uint8Array(32).fill(7))),
		);
	});

	it.each(["onReminder", "unsupported"])(
		"지원하지 않는 %s 대기 문자는 복호화·발송·기록 없이 소진한다",
		async (kind) => {
			await expect(deliverSms({ ...QUEUED, kind }, NOW)).resolves.toBe(
				"discarded",
			);
			expect(keys).not.toHaveBeenCalled();
			expect(findMessage).not.toHaveBeenCalled();
			expect(send).not.toHaveBeenCalled();
			expect(record).not.toHaveBeenCalled();
		},
	);

	it("구조가 잘못된 메시지는 발송하지 않는다", async () => {
		await expect(
			deliverSms({ ...QUEUED, kind: "onCreate", payload: null }, NOW),
		).rejects.toMatchObject({ name: "ZodError" });
		expect(send).not.toHaveBeenCalled();
		expect(record).not.toHaveBeenCalled();
	});

	it.each(["onCreate", "onUpdate"])(
		"%s 문자는 계속 발송하고 발송 사실을 기록한다",
		async (kind) => {
			const dataKeys = await keys();
			const payload = { to: "01012345678", text: "신청 내용 안내" };
			const message = {
				...QUEUED,
				kind,
				payload: await encryptJson(dataKeys.encryption, payload),
			};
			await expect(deliverSms(message, NOW)).resolves.toBe("sent");
			expect(send).toHaveBeenCalledExactlyOnceWith(payload.to, payload.text);
			expect(record).toHaveBeenCalledWith(
				expect.objectContaining({ kind, createdAt: NOW, status: "logged" }),
			);
		},
	);

	it("이미 발송한 신청 알림은 다시 보내지 않는다", async () => {
		findMessage.mockResolvedValue({
			id: "delivered",
			submissionId: QUEUED.submissionId,
			idempotencyKey: QUEUED.idempotencyKey,
			kind: "onCreate",
			status: "logged",
			providerMessageId: "fake-message",
			error: null,
			createdAt: NOW,
		});
		await expect(
			deliverSms({ ...QUEUED, kind: "onCreate" }, NOW),
		).resolves.toBe("duplicate");
		expect(send).not.toHaveBeenCalled();
		expect(keys).not.toHaveBeenCalled();
	});
});
