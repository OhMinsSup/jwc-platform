import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vite-plus/test";

import { base64ToBytes } from "../src/server/encoding";
import {
	createTokenProvider,
	GoogleAuthError,
	signServiceAccountJwt,
} from "../src/server/google/service-account";
import {
	columnLetter,
	createSheetsClient,
	quoteSheetName,
	SheetsApiError,
} from "../src/server/google/sheets-client";
import { jsonBody, recordingFetch, rejectionOf } from "./fakes";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
	modulusLength: 2048,
});
const pem = privateKey.export({ type: "pkcs8", format: "pem" });
const account = {
	email: "svc@project.iam.gserviceaccount.com",
	privateKeyPem: pem.replaceAll("\n", "\\n"),
};

/** JWT 조각(base64url, 패딩 없음) → 바이트. atob은 패딩 없는 입력도 받는다 */
function base64UrlToBytes(segment: string) {
	return base64ToBytes(segment.replaceAll("-", "+").replaceAll("_", "/"));
}

function decodeSegment(segment: string): unknown {
	return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

function tokenResponse(value: string) {
	return Response.json({ access_token: value, expires_in: 3600 });
}

/** 토큰은 고정값, 응답은 주어진 상태 코드 하나 */
function failingSheetsClient(status: number) {
	return createSheetsClient(
		"id",
		() => Promise.resolve("t"),
		recordingFetch([new Response("x", { status })]).impl,
	);
}

function sheetsError(status: number) {
	return rejectionOf(
		failingSheetsClient(status).getValues("'a'!1:1"),
		SheetsApiError,
	);
}

describe("서비스 계정 JWT", () => {
	it("RS256으로 서명되고 공개키로 검증된다", async () => {
		const jwt = await signServiceAccountJwt(account, 1000);
		const [header = "", claims = "", signature = ""] = jwt.split(".");
		expect(decodeSegment(header)).toStrictEqual({ alg: "RS256", typ: "JWT" });
		expect(decodeSegment(claims)).toMatchObject({
			iss: account.email,
			iat: 1000,
			exp: 4600,
			aud: "https://oauth2.googleapis.com/token",
		});
		const spki = publicKey.export({ type: "spki", format: "der" });
		const key = await crypto.subtle.importKey(
			"spki",
			spki,
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			false,
			["verify"],
		);
		const ok = await crypto.subtle.verify(
			"RSASSA-PKCS1-v1_5",
			key,
			base64UrlToBytes(signature),
			new TextEncoder().encode(`${header}.${claims}`),
		);
		expect(ok).toBe(true);
	});

	it("토큰을 캐시하고 만료 임박 시 재발급한다", async () => {
		let now = 0;
		const fake = recordingFetch([tokenResponse("t1"), tokenResponse("t2")]);
		const provider = createTokenProvider(account, fake.impl, () => now);
		await expect(provider()).resolves.toBe("t1");
		now = 50 * 60 * 1000;
		await expect(provider()).resolves.toBe("t1");
		now = 56 * 60 * 1000;
		await expect(provider()).resolves.toBe("t2");
		expect(fake.calls).toHaveLength(2);
	});

	it("토큰 발급 실패를 구체적 오류로 보고한다", async () => {
		const fake = recordingFetch([new Response("denied", { status: 403 })]);
		await expect(
			createTokenProvider(account, fake.impl)(),
		).rejects.toBeInstanceOf(GoogleAuthError);
	});
});

describe("Sheets REST 클라이언트", () => {
	it("A1 표기 유틸", () => {
		expect([1, 26, 27, 52, 703].map(columnLetter)).toStrictEqual([
			"A",
			"Z",
			"AA",
			"AZ",
			"AAA",
		]);
		expect(quoteSheetName("수련회's")).toBe("'수련회''s'");
	});

	it("RAW로 쓰고 Bearer 토큰을 보낸다", async () => {
		const fake = recordingFetch([Response.json({})]);
		const client = createSheetsClient(
			"sheet/id",
			() => Promise.resolve("tok"),
			fake.impl,
		);
		await client.updateValues("'탭'!A2:B2", [["a", null]]);
		const [call] = fake.calls;
		expect(call?.url).toContain("/spreadsheets/sheet%2Fid/values/");
		expect(call?.url).toContain("valueInputOption=RAW");
		expect(call?.init.method).toBe("PUT");
		expect(new Headers(call?.init.headers).get("authorization")).toBe(
			"Bearer tok",
		);
		expect(jsonBody(call)).toStrictEqual({
			values: [["a", null]],
		});
	});

	it("429/5xx는 재시도 가능, 4xx는 불가", async () => {
		const tooMany = await sheetsError(429);
		const unavailable = await sheetsError(503);
		const badRequest = await sheetsError(400);
		expect(tooMany.retryable).toBe(true);
		expect(unavailable.retryable).toBe(true);
		expect(badRequest.retryable).toBe(false);
	});
});
