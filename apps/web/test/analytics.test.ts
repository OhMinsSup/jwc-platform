import { describe, expect, it } from "vite-plus/test";

import { replayAllowedOn, sanitizeUrl } from "../src/platform/analytics/events";

describe(sanitizeUrl, () => {
	it("신청 내역 id(열람 권한)는 지운다", () => {
		expect(sanitizeUrl("https://x.test/r/AbC123_-xyz?ref=sms")).toBe(
			"https://x.test/r/:id?ref=sms",
		);
		expect(sanitizeUrl("/r/abc")).toBe("/r/:id");
	});

	it("다른 주소는 그대로 둔다", () => {
		expect(sanitizeUrl("https://x.test/f/retreat?step=review")).toBe(
			"https://x.test/f/retreat?step=review",
		);
	});
});

describe(replayAllowedOn, () => {
	it("공개 폼 화면만 허용한다", () => {
		expect(replayAllowedOn("/f/retreat")).toBe(true);
		expect(replayAllowedOn("/f/retreat/")).toBe(true);
	});

	it("관리자, 신청 내역, 완료 화면은 제외한다", () => {
		expect(replayAllowedOn("/admin/forms")).toBe(false);
		expect(replayAllowedOn("/r/abc")).toBe(false);
		expect(replayAllowedOn("/f/retreat/done")).toBe(false);
		expect(replayAllowedOn("/")).toBe(false);
	});
});
