/**
 * 단축 URL 리다이렉트 라우트
 *
 * /s/:code 형식의 URL을 원본 URL로 리다이렉트합니다.
 * SSR에서 서버사이드 리다이렉트를 수행합니다.
 */

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@jwc/backend/convex/_generated/api";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$code")({
	loader: async ({ params, context }) => {
		const shortUrl = await context.convexQueryClient.fetchQuery(
			convexQuery(api.shortUrl.getByCode, { code: params.code })
		);

		if (!shortUrl) {
			throw notFound();
		}

		// 서버사이드 리다이렉트
		throw redirect({
			href: shortUrl.targetUrl,
			statusCode: 302,
		});
	},
	notFoundComponent: ShortUrlNotFound,
});

function ShortUrlNotFound() {
	return (
		<div className="flex min-h-svh items-center justify-center">
			<div className="text-center">
				<h1 className="mb-2 font-bold text-2xl">링크를 찾을 수 없습니다</h1>
				<p className="text-muted-foreground">
					유효하지 않거나 만료된 링크입니다.
				</p>
			</div>
		</div>
	);
}
