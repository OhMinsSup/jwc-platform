/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getClientConfigFn } from "../platform/functions/client-config";
import { pageMeta } from "../platform/metadata";
import { AnalyticsBridge } from "../platform/ui/analytics-bridge";
import { NavigationProgress } from "../platform/ui/navigation-progress";

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
			...pageMeta({ title: "행사 신청" }),
		],
		links: [
			{
				rel: "preconnect",
				href: "https://cdn.jsdelivr.net",
				crossOrigin: "anonymous",
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
			<NavigationProgress />
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
