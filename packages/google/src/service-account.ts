import { base64ToBytes, bytesToBase64Url, utf8 } from "@jwc/common/encoding";
import { z } from "zod";

/**
 * Google 서비스 계정 OAuth (JWT bearer grant).
 * googleapis SDK는 Node 전용이라 WebCrypto RS256 서명 + fetch로 직접 구현한다.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_LIFETIME_SECONDS = 3600;
/** 만료 전에 미리 갱신할 여유 */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

const WHITESPACE = /\s+/gu;

const TokenResponseSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
});

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

export class GoogleAuthError extends Error {
	override name = "GoogleAuthError";
	/** 토큰 엔드포인트 HTTP 상태. 키 형식 오류처럼 요청 전에 실패하면 null */
	readonly status: number | null;
	constructor(
		message: string,
		options: ErrorOptions & { status?: number } = {},
	) {
		const { status = null, ...errorOptions } = options;
		super(message, errorOptions);
		this.status = status;
	}
	/** 일시 장애(할당량/서버 오류)면 재시도 가치가 있다. 그 외는 자격 증명 설정 문제 */
	get retryable(): boolean {
		return (
			this.status !== null &&
			(this.status === TOO_MANY_REQUESTS || this.status >= SERVER_ERROR)
		);
	}
}

export interface ServiceAccount {
	email: string;
	/** PEM PKCS#8. 환경변수의 "\n" 이스케이프를 허용한다 */
	privateKeyPem: string;
}

function pemToPkcs8(pem: string): Uint8Array<ArrayBuffer> {
	const body = pem
		.replaceAll("\\n", "\n")
		.replace("-----BEGIN PRIVATE KEY-----", "")
		.replace("-----END PRIVATE KEY-----", "")
		.replaceAll(WHITESPACE, "");
	try {
		return base64ToBytes(body);
	} catch (error) {
		throw new GoogleAuthError(
			"GOOGLE_PRIVATE_KEY가 PEM(PKCS#8) 형식이 아닙니다. 서비스 계정 JSON의 private_key 값을 그대로 넣어주세요",
			{ cause: error },
		);
	}
}

function encodeSegment(value: object): string {
	return bytesToBase64Url(utf8(JSON.stringify(value)));
}

export async function signServiceAccountJwt(
	account: ServiceAccount,
	nowSeconds: number,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		"pkcs8",
		pemToPkcs8(account.privateKeyPem),
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"],
	);
	const header = encodeSegment({ alg: "RS256", typ: "JWT" });
	const claims = encodeSegment({
		iss: account.email,
		scope: SHEETS_SCOPE,
		aud: TOKEN_URL,
		iat: nowSeconds,
		exp: nowSeconds + TOKEN_LIFETIME_SECONDS,
	});
	const signingInput = `${header}.${claims}`;
	const signature = new Uint8Array(
		await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, utf8(signingInput)),
	);
	return `${signingInput}.${bytesToBase64Url(signature)}`;
}

interface CachedToken {
	accessToken: string;
	expiresAt: number;
}

export type TokenProvider = () => Promise<string>;

/** isolate 메모리에 토큰을 캐시하는 공급자. fetchImpl 주입으로 테스트 가능. */
export function createTokenProvider(
	account: ServiceAccount,
	fetchImpl: typeof fetch = fetch,
	now: () => number = Date.now,
): TokenProvider {
	let cached: CachedToken | null = null;
	return async () => {
		if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now()) {
			return cached.accessToken;
		}
		const assertion = await signServiceAccountJwt(
			account,
			Math.floor(now() / 1000),
		);
		const response = await fetchImpl(TOKEN_URL, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion,
			}),
		});
		if (!response.ok) {
			throw new GoogleAuthError(
				`Google 토큰 발급 실패 (HTTP ${response.status})`,
				{ status: response.status },
			);
		}
		const parsed = TokenResponseSchema.safeParse(await response.json());
		if (!parsed.success) {
			throw new GoogleAuthError("Google 토큰 응답 형식이 올바르지 않습니다");
		}
		const body = parsed.data;
		cached = {
			accessToken: body.access_token,
			expiresAt: now() + body.expires_in * 1000,
		};
		return cached.accessToken;
	};
}
