import { createFileRoute } from "@tanstack/react-router";

import {
	CRAWLER_FILE_CACHE_CONTROL,
	robotsTxt,
} from "../platform/crawler-files";
import { siteOrigin } from "../platform/server/runtime";

/** 수집기 규칙. Sitemap 줄에 절대 주소가 필요해 정적 파일 대신 요청 때 만든다 (ADR-0023) */
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () =>
				new Response(robotsTxt(siteOrigin()), {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": CRAWLER_FILE_CACHE_CONTROL,
					},
				}),
		},
	},
});
