import { spawn } from "node:child_process";
import { createServer, request } from "node:http";
import { createGzip } from "node:zlib";

// Cloudflare는 정적 텍스트 자산을 압축한다. 로컬 preview에는 압축이 없으므로
// 공개 더미 performance 빌드 앞에서만 같은 전송 조건을 재현한다. 제품 서버에는 포함되지 않는다.
const preview = spawn(
	"pnpm",
	[
		"exec",
		"vp",
		"preview",
		"--mode",
		"performance",
		"--port",
		"5182",
		"--strictPort",
	],
	{ stdio: "inherit" },
);
const server = createServer((incoming, outgoing) => {
	const upstream = request(
		new URL(incoming.url ?? "/", "http://localhost:5182"),
		{
			method: incoming.method,
			headers: incoming.headers,
		},
		(response) => {
			const compress =
				incoming.method === "GET" &&
				/^\/assets\/[^?]+\.(?:css|js)(?:\?|$)/u.test(incoming.url ?? "");
			const headers = { ...response.headers };
			if (compress) {
				delete headers["content-length"];
				headers["content-encoding"] = "gzip";
				headers.vary = "Accept-Encoding";
			}
			outgoing.writeHead(response.statusCode ?? 502, headers);
			if (compress) {
				response.pipe(createGzip()).pipe(outgoing);
			} else {
				response.pipe(outgoing);
			}
		},
	);
	upstream.on("error", () => {
		outgoing.writeHead(503);
		outgoing.end("Performance preview is starting");
	});
	incoming.pipe(upstream);
});
server.listen(5181, "localhost");
preview.on("exit", () => {
	server.close();
});
