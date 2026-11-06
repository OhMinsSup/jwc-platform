/** Workers/브라우저/Node 공통 바이트 인코딩 (Buffer 미사용) */

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCodePoint(byte);
	}
	return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		// atob 결과는 0–255 문자만 담으므로 i < length 범위에서 값이 항상 있다
		bytes[i] = binary.codePointAt(i) ?? 0;
	}
	return bytes;
}

const BASE64_PADDING = /[=]+$/u;

export function bytesToBase64Url(bytes: Uint8Array): string {
	return bytesToBase64(bytes)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(BASE64_PADDING, "");
}

export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

export function utf8(text: string): Uint8Array<ArrayBuffer> {
	return new TextEncoder().encode(text);
}

/** 길이 노출 없는 상수 시간 비교 (서명/시크릿 비교용) */
export function timingSafeEqual(a: string, b: string): boolean {
	const left = utf8(a);
	const right = utf8(b);
	// oxlint-disable-next-line no-bitwise -- 상수 시간 비교에는 비트 연산이 의도적으로 필요하다
	let diff = left.length ^ right.length;
	const length = Math.max(left.length, right.length);
	for (let i = 0; i < length; i += 1) {
		// oxlint-disable-next-line no-bitwise -- 상수 시간 비교 (분기 없이 차이 누적)
		diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
	}
	return diff === 0;
}

const ID_BYTES = 16;

/** 추측 불가능한 128비트 식별자 (URL 안전) */
export function randomId(): string {
	return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(ID_BYTES)));
}
