/**
 * 구조화 로깅. 민감 키는 값 대신 [REDACTED]로 남긴다.
 * 개인정보/토큰을 넘기지 않는 것이 원칙이며, 이 마스킹은 실수에 대한 안전망이다.
 */
const SENSITIVE_KEYS = new Set([
	"phone",
	"to",
	"text",
	"answers",
	"password",
	"token",
	"secret",
	"authorization",
	"privateKey",
]);

type Fields = Record<string, unknown>;

function redact(fields: Fields): Fields {
	return Object.fromEntries(
		Object.entries(fields).map(([key, value]) => [
			key,
			SENSITIVE_KEYS.has(key) ? "[REDACTED]" : value,
		]),
	);
}

function write(
	level: "info" | "warn" | "error",
	event: string,
	fields: Fields = {},
) {
	const line = JSON.stringify({
		level,
		event,
		at: new Date().toISOString(),
		...redact(fields),
	});
	if (level === "error") {
		console.error(line);
	} else if (level === "warn") {
		console.warn(line);
	} else {
		console.log(line);
	}
}

export const log = {
	info: (event: string, fields?: Fields) => write("info", event, fields),
	warn: (event: string, fields?: Fields) => write("warn", event, fields),
	error: (event: string, fields?: Fields) => write("error", event, fields),
};

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
