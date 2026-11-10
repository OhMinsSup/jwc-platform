/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getClientConfigFn } from "../platform/functions/client-config";
import { pageMeta, shareImageMeta } from "../platform/metadata";
import { AnalyticsBridge } from "../platform/ui/analytics-bridge";
import { NavigationProgress } from "../platform/ui/navigation-progress";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	// 공개 설정은 배포 사이에 바뀌지 않으므로 한 번만 읽는다
	loader: () => getClientConfigFn(),
	staleTime: Number.POSITIVE_INFINITY,
	head: ({ loaderData }) => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "robots", content: "noindex, nofollow" },
			...pageMeta({ title: "신청서" }),
			// 하위 화면은 이미지 메타를 두지 않으므로 모든 화면의 공유 미리보기가 이 이미지를 쓴다
			...shareImageMeta(loaderData?.siteOrigin ?? ""),
		],
		links: [
			{
				rel: "preconnect",
				href: "https://cdn.jsdelivr.net",
				crossOrigin: "anonymous",
			},
			{ rel: "stylesheet", href: appCss },
			// 앱 아이콘 (public/, 원본은 favicon.svg). ico는 SVG를 못 읽는 브라우저용
			{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/site.webmanifest" },
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
				{/* 주소창·탭 색을 화면 바탕(--background)에 맞춘다. HeadContent는 같은 name의 meta를
				    하나만 남기므로 라이트/다크 한 쌍은 여기에 직접 둔다 */}
				<meta
					content="#f9fafd"
					media="(prefers-color-scheme: light)"
					name="theme-color"
				/>
				<meta
					content="#0a0b0e"
					media="(prefers-color-scheme: dark)"
					name="theme-color"
				/>
			</head>
			<body className="bg-background text-foreground min-h-svh font-sans antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
