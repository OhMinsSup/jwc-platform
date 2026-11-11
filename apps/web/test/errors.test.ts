import { SubmissionStoreError } from "@jwc/submission-store";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { ERROR_CATALOG } from "../src/platform/server/errors/catalog";
import { classifyError } from "../src/platform/server/errors/classify";
import { ConflictError } from "../src/platform/server/errors/conflict-error";
import { DomainError } from "../src/platform/server/errors/domain-error";
import { FormClosedError } from "../src/platform/server/errors/form-closed-error";
import { InvalidInputError } from "../src/platform/server/errors/invalid-input-error";
import { NotFoundError } from "../src/platform/server/errors/not-found-error";
import { SmsSendError } from "../src/platform/server/solapi";

describe(classifyError, () => {
	it("도메인 오류는 자기 코드와 사용자 문장을 그대로 쓴다", () => {
		const failure = classifyError(
			new ConflictError("이미 사용 중인 주소입니다"),
		);
		expect(failure.code).toBe("conflict");
		expect(failure.userMessage).toBe("이미 사용 중인 주소입니다");
		expect(failure.spec.status).toBe(409);
	});

	it("입력 오류는 필드 오류를 함께 돌려주고 보고하지 않는다", () => {
		const failure = classifyError(
			new InvalidInputError("입력값을 확인해주세요", { phone: "형식 오류" }),
		);
		expect(failure.code).toBe("invalid_input");
		expect(failure.fieldErrors).toStrictEqual({ phone: "형식 오류" });
		expect(failure.spec.report).toBe(false);
	});

	it.each([
		["unavailable", "store_unavailable", true],
		["forbidden", "store_misconfigured", false],
		["layout", "store_misconfigured", false],
		["not_found", "not_found", false],
	] as const)("저장소 %s → %s (재시도 %s)", (failure, code, retryable) => {
		const classified = classifyError(new SubmissionStoreError(failure, "내부"));
		expect(classified.code).toBe(code);
		expect(classified.spec.retryable).toBe(retryable);
	});

	it("내부 상세는 사용자 문장에 나오지 않는다", () => {
		const failure = classifyError(
			new SubmissionStoreError("forbidden", "service-account@x 권한 없음"),
		);
		expect(failure.userMessage).toBe(
			ERROR_CATALOG.store_misconfigured.defaultMessage,
		);
		expect(failure.internalMessage).toContain("권한 없음");
	});

	it("회귀: 내부 문장에 원인(cause) 사슬을 남긴다 (DB 드라이버 오류는 원인에만 이유가 있다)", () => {
		const driver = new Error("D1_ERROR: no such column: spreadsheet_id");
		const query = new Error("Failed query: update forms …", { cause: driver });
		const failure = classifyError(query);
		expect(failure.internalMessage).toContain("Failed query");
		expect(failure.internalMessage).toContain("no such column: spreadsheet_id");
		expect(failure.userMessage).toBe(ERROR_CATALOG.internal.defaultMessage);
	});

	it("문자 발송 오류는 재시도 가능 여부로 나뉜다", () => {
		expect(classifyError(new SmsSendError("x", true)).code).toBe(
			"upstream_unavailable",
		);
		expect(classifyError(new SmsSendError("x", false)).code).toBe(
			"upstream_rejected",
		);
	});

	it("계약 위반 페이로드(zod)는 재시도하지 않는다 (독성 메시지)", () => {
		const parsed = z.object({ to: z.string() }).safeParse({});
		const failure = classifyError(parsed.error);
		expect(failure.code).toBe("invalid_payload");
		expect(failure.spec.retryable).toBe(false);
	});

	it("분류할 수 없는 오류는 internal: 일반 문장 + 보고", () => {
		const failure = classifyError(new TypeError("undefined is not a function"));
		expect(failure.code).toBe("internal");
		expect(failure.userMessage).not.toContain("undefined");
		expect(failure.spec.report).toBe(true);
	});

	it("상태 코드는 카탈로그에서 온다", () => {
		expect(new NotFoundError().status).toBe(404);
		expect(new FormClosedError().status).toBe(409);
		expect(new DomainError("x", { code: "rate_limited" }).status).toBe(429);
	});
});
