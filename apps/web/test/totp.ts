import { createHmac } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_MS = 30_000;
const MODULUS = 1_000_000;

/** RFC 6238로 직접 계산해 라이브러리의 생성 코드와 독립적으로 검증한다. */
export function totp(uri: string): string {
	const secret = new URL(uri).searchParams.get("secret");
	if (!secret) {
		throw new Error("인증 앱 설정 키가 없습니다");
	}
	let bits = "";
	for (const char of secret.toUpperCase().replaceAll("=", "")) {
		bits += ALPHABET.indexOf(char).toString(2).padStart(5, "0");
	}
	const bytes = Uint8Array.from(
		Array.from({ length: Math.floor(bits.length / 8) }, (_, index) =>
			Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2),
		),
	);
	const counter = new Uint8Array(8);
	new DataView(counter.buffer).setBigUint64(
		0,
		BigInt(Math.floor(Date.now() / PERIOD_MS)),
	);
	const digest = createHmac("sha1", bytes).update(counter).digest();
	const offset = (digest.at(-1) ?? 0) % 16;
	return ((digest.readUInt32BE(offset) % 2 ** 31) % MODULUS)
		.toString()
		.padStart(6, "0");
}
