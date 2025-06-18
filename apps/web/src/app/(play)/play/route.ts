import { playHtml } from "~/libs/utils/html";

export async function GET() {
	return new Response(playHtml(), {
		headers: {
			"Content-Type": "text/html",
			// 1시간(3600초) 동안 캐시, public(모든 사용자/프록시 캐시 허용)
			"Cache-Control": "public, max-age=3600, immutable",
		},
	});
}
