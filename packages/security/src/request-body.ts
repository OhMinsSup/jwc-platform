/** 선언된 길이가 아닌 실제 수신 바이트를 제한하는 HTTP 경계. */
export class PayloadTooLargeError extends Error {
	override name = "PayloadTooLargeError";
	constructor() {
		super("요청 본문이 너무 큽니다");
	}
}

export async function limitRequestBody(
	request: Request,
	maxBytes: number,
): Promise<Request> {
	if (!request.body) {
		return request;
	}
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			// oxlint-disable-next-line no-await-in-loop -- 네트워크 스트림은 순서대로 읽고 상한을 넘는 즉시 중단해야 한다.
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			size += value.byteLength;
			if (size > maxBytes) {
				// oxlint-disable-next-line no-await-in-loop -- 초과 본문을 더 읽지 않고 연결의 스트림을 정리한다.
				await reader.cancel();
				throw new PayloadTooLargeError();
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const body = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}
	const headers = new Headers(request.headers);
	headers.delete("transfer-encoding");
	headers.set("content-length", String(size));
	return new Request(request, { method: request.method, body, headers });
}
