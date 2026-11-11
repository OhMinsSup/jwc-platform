import { rejectionOf } from "@jwc/common/testing";
import { GoogleAuthError } from "@jwc/google/service-account";
import { SheetsApiError } from "@jwc/google/sheets-client";
import { FakeSheets } from "@jwc/google/testing";
import { describe, expect, it } from "vite-plus/test";

import {
	contractDefinition,
	describeSubmissionStoreContract,
} from "../src/contract";
import { createGoogleSheetsStore } from "../src/google-sheets/store";
import { createMemorySubmissionStore } from "../src/memory";
import { SubmissionStoreError } from "../src/port";

describeSubmissionStoreContract("memory", createMemorySubmissionStore);
describeSubmissionStoreContract("google-sheets", () =>
	createGoogleSheetsStore(new FakeSheets()),
);

/** 읽기가 항상 같은 오류로 실패하는 시트 클라이언트 */
class FailingSheets extends FakeSheets {
	private readonly error: Error;
	constructor(error: Error) {
		super();
		this.error = error;
	}
	override listSheets(): Promise<never> {
		return Promise.reject(this.error);
	}
	override getValues(): Promise<never> {
		return Promise.reject(this.error);
	}
}

function failingSheets(error: Error): FakeSheets {
	return new FailingSheets(error);
}

const TARGET = { collection: "t", definition: contractDefinition() };

describe("google-sheets 어댑터: 공급자 오류 → 포트 오류", () => {
	const cases: [string, Error, string, boolean][] = [
		["권한 없음(403)", new SheetsApiError(403, "x"), "forbidden", false],
		["할당량(429)", new SheetsApiError(429, "x"), "unavailable", true],
		["서버 오류(503)", new SheetsApiError(503, "x"), "unavailable", true],
		["자격 증명 오류", new GoogleAuthError("bad key"), "forbidden", false],
		[
			"토큰 서버 오류",
			new GoogleAuthError("x", { status: 503 }),
			"unavailable",
			true,
		],
	];

	it.each(cases)("%s", async (_, cause, failure, retryable) => {
		const store = createGoogleSheetsStore(failingSheets(cause));
		const error = await rejectionOf(store.list(TARGET), SubmissionStoreError);
		expect(error.failure).toBe(failure);
		expect(error.retryable).toBe(retryable);
		expect(error.cause).toBe(cause);
	});

	it("분류할 수 없는 오류는 그대로 전달한다", async () => {
		const bug = new TypeError("bug");
		const store = createGoogleSheetsStore(failingSheets(bug));
		await expect(store.list(TARGET)).rejects.toBe(bug);
	});
});
