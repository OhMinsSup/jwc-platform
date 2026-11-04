import { describe, expect, it } from "vite-plus/test";

import {
	CryptoConfigError,
	decryptJson,
	decryptText,
	deriveDataKeys,
	encryptJson,
	encryptText,
	hmacHex,
	hmacWithSecret,
} from "../src/server/crypto";
import { bytesToBase64, timingSafeEqual } from "../src/server/encoding";
import { verifyWebhookSignature } from "../src/server/webhook-signature";

const MASTER = bytesToBase64(new Uint8Array(32).fill(7));
const OTHER = bytesToBase64(new Uint8Array(32).fill(9));

describe("데이터 암호화", () => {
	it("암호화 → 복호화 왕복, 같은 평문도 매번 다른 암호문", async () => {
		const keys = await deriveDataKeys(MASTER);
		const a = await encryptText(keys.encryption, "01012345678");
		const b = await encryptText(keys.encryption, "01012345678");
		expect(a).not.toBe(b);
		expect(a.startsWith("v1.")).toBe(true);
		await expect(decryptText(keys.encryption, a)).resolves.toBe("01012345678");
	});

	it("다른 키로는 복호화할 수 없다", async () => {
		const masterKeys = await deriveDataKeys(MASTER);
		const otherKeys = await deriveDataKeys(OTHER);
		const token = await encryptText(masterKeys.encryption, "secret");
		// AES-GCM 인증 실패는 WebCrypto의 OperationError (메시지는 런타임마다 다르다)
		await expect(
			decryptText(otherKeys.encryption, token),
		).rejects.toMatchObject({ name: "OperationError" });
	});

	it("JSON 페이로드 왕복", async () => {
		const keys = await deriveDataKeys(MASTER);
		const payload = {
			answers: { name: "홍길동", multi: ["a", "b"] },
			notify: "onCreate",
		};
		await expect(
			decryptJson(keys.encryption, await encryptJson(keys.encryption, payload)),
		).resolves.toStrictEqual(payload);
	});

	it("식별 해시는 키에 따라 결정적이며 키가 다르면 다르다", async () => {
		// 같은 마스터 키로 따로 파생한 두 키가 같은 해시를 내는지 본다
		const first = await deriveDataKeys(MASTER);
		const second = await deriveDataKeys(MASTER);
		const other = await deriveDataKeys(OTHER);
		const a = await hmacHex(first.identity, "form:01012345678");
		const b = await hmacHex(second.identity, "form:01012345678");
		const c = await hmacHex(other.identity, "form:01012345678");
		expect(a).toBe(b);
		expect(a).not.toBe(c);
	});

	it("잘못된 길이의 마스터 키와 알 수 없는 암호문 형식을 거부한다", async () => {
		await expect(
			deriveDataKeys(bytesToBase64(new Uint8Array(16))),
		).rejects.toBeInstanceOf(CryptoConfigError);
		const keys = await deriveDataKeys(MASTER);
		await expect(decryptText(keys.encryption, "v0.a.b")).rejects.toBeInstanceOf(
			CryptoConfigError,
		);
	});

	it("timingSafeEqual", () => {
		expect(timingSafeEqual("abc", "abc")).toBe(true);
		expect(timingSafeEqual("abc", "abd")).toBe(false);
		expect(timingSafeEqual("abc", "abcd")).toBe(false);
	});
});

describe("웹훅 서명", () => {
	const secret = "webhook-secret";
	const body = '{"id":"x"}';
	const now = 1_800_000_000_000;

	it("올바른 서명과 시간을 허용한다", async () => {
		const signature = await hmacWithSecret(secret, `${now}.${body}`);
		await expect(
			verifyWebhookSignature(
				secret,
				{ timestamp: String(now), signature },
				body,
				now + 1000,
			),
		).resolves.toBe(true);
	});

	it("본문 변조, 오래된 타임스탬프, 누락된 헤더를 거부한다", async () => {
		const signature = await hmacWithSecret(secret, `${now}.${body}`);
		await expect(
			verifyWebhookSignature(
				secret,
				{ timestamp: String(now), signature },
				'{"id":"y"}',
				now,
			),
		).resolves.toBe(false);
		await expect(
			verifyWebhookSignature(
				secret,
				{ timestamp: String(now), signature },
				body,
				now + 6 * 60 * 1000,
			),
		).resolves.toBe(false);
		await expect(
			verifyWebhookSignature(secret, { timestamp: null, signature }, body, now),
		).resolves.toBe(false);
		await expect(
			verifyWebhookSignature(
				secret,
				{ timestamp: String(now), signature: null },
				body,
				now,
			),
		).resolves.toBe(false);
	});
});
