/**
 * 테스트 지원 (계약 테스트용 가짜 fetch, 실패 단언). 운영 코드에서 쓰지 않는다.
 */

/** fetch 입력(문자열/URL/Request)의 주소 */
function requestUrl(input: string | URL | Request): string {
	if (typeof input === "string") {
		return input;
	}
	return input instanceof URL ? input.href : input.url;
}

/** fetch 계약 테스트용: 호출을 기록하고 준비된 응답을 순서대로 돌려준다 */
export function recordingFetch(responses: Response[]) {
	const calls: { url: string; init: RequestInit }[] = [];
	const impl = ((input: string | URL | Request, init: RequestInit = {}) => {
		calls.push({ url: requestUrl(input), init });
		const next = responses.shift();
		if (!next) {
			return Promise.reject(new Error("예상하지 못한 fetch 호출"));
		}
		return Promise.resolve(next);
	}) as typeof fetch;
	return { impl, calls };
}

/** 기록된 호출의 JSON 본문. 본문이 문자열이 아니면 테스트를 실패시킨다 */
export function jsonBody(call: { init: RequestInit } | undefined): unknown {
	const body = call?.init.body;
	if (typeof body !== "string") {
		throw new TypeError("JSON 문자열 본문이 없습니다");
	}
	return JSON.parse(body);
}

/** Promise가 반드시 실패해야 하는 경우 그 오류를 꺼낸다. 다른 종류의 오류면 그대로 다시 던진다 */
export async function rejectionOf<E>(
	promise: Promise<unknown>,
	errorType: abstract new (...args: never[]) => E,
): Promise<E> {
	try {
		await promise;
	} catch (error) {
		if (error instanceof errorType) {
			return error;
		}
		throw error;
	}
	throw new Error("실패를 기대했지만 성공했습니다");
}
