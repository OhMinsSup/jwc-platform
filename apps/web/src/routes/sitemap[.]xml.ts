import { createFileRoute } from "@tanstack/react-router";

import { openFormSummaries } from "../features/forms/server/definitions";
import {
	CRAWLER_FILE_CACHE_CONTROL,
	sitemapXml,
} from "../platform/crawler-files";
import { siteOrigin } from "../platform/server/runtime";

/** 노출 화면 목록: 홈 + 접수 중인 공개 폼 (ADR-0023) */
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () =>
				new Response(sitemapXml(siteOrigin(), await openFormSummaries()), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": CRAWLER_FILE_CACHE_CONTROL,
					},
				}),
		},
	},
});
