/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BRAND_NAME, BRAND_THEME_COLORS } from "../platform/brand";
import { getClientConfigFn } from "../platform/functions/client-config";
import { pageMeta, shareCardMeta } from "../platform/metadata";
import { NOINDEX_ROBOTS } from "../platform/search";
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
			// 기본은 비노출. 홈·접수 중인 공개 폼만 하위 화면에서 index로 덮는다 (ADR-0023)
			{ name: "robots", content: NOINDEX_ROBOTS },
			{ name: "application-name", content: BRAND_NAME },
			{ name: "apple-mobile-web-app-title", content: BRAND_NAME },
			...pageMeta({ title: "신청서" }),
			// 하위 화면은 카드 종류·이미지 메타를 두지 않으므로 모든 화면의 공유 미리보기가 이 카드를 쓴다
			...shareCardMeta(loaderData?.siteOrigin),
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
		// 브라우저 확장(예: Google Tag Assistant)이 하이드레이션 전에 <html>에 속성을 넣어
		// 경고가 난다. 이 요소 자신의 속성 불일치만 무시하고 자식 검사는 그대로 둔다
		<html lang="ko" suppressHydrationWarning>
			<head>
				<HeadContent />
				{/* 주소창·탭 색을 화면 바탕(--background)에 맞춘다. HeadContent는 같은 name의 meta를
				    하나만 남기므로 라이트/다크 한 쌍은 여기에 직접 둔다 */}
				<meta
					content={BRAND_THEME_COLORS.light}
					media="(prefers-color-scheme: light)"
					name="theme-color"
				/>
				<meta
					content={BRAND_THEME_COLORS.dark}
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
