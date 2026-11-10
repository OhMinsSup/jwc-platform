import { createFileRoute } from "@tanstack/react-router";

import { openFormSummaries } from "../features/forms/server/definitions";
import { CRAWLER_FILE_CACHE_CONTROL, llmsTxt } from "../platform/crawler-files";
import { siteOrigin } from "../platform/server/runtime";

/** AI 수집기용 사이트 요약 (llms.txt, ADR-0023) */
export const Route = createFileRoute("/llms.txt")({
	server: {
		handlers: {
			GET: async () =>
				new Response(llmsTxt(siteOrigin(), await openFormSummaries()), {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": CRAWLER_FILE_CACHE_CONTROL,
					},
				}),
		},
	},
});
