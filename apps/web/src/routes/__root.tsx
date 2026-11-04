/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getClientConfigFn } from "../platform/functions/client-config";
import { AnalyticsBridge } from "../platform/ui/analytics-bridge";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	// 공개 설정은 배포 사이에 바뀌지 않으므로 한 번만 읽는다
	loader: () => getClientConfigFn(),
	staleTime: Number.POSITIVE_INFINITY,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "robots", content: "noindex, nofollow" },
			{ title: "JWC 신청서" },
		],
		links: [
			{
				rel: "preconnect",
				href: "https://cdn.jsdelivr.net",
				crossOrigin: "anonymous",
			},
			// UI 글꼴(SUIT)과 제목 글꼴(Wanted Sans). 둘 다 가변 글꼴(OFL)이라 파일 하나로 모든 굵기를 쓴다
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2.0.5/fonts/variable/woff2/SUIT-Variable.css",
			},
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
			},
			{ rel: "stylesheet", href: appCss },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	const { analytics } = Route.useLoaderData();
	return (
		<RootDocument>
			<AnalyticsBridge config={analytics} />
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="ko">
			<head>
				<HeadContent />
			</head>
			<body className="bg-background text-foreground min-h-svh font-sans antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
