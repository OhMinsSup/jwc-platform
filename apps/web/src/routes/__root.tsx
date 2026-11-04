/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
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
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
			},
			{ rel: "stylesheet", href: appCss },
		],
	}),
	component: () => (
		<RootDocument>
			<Outlet />
		</RootDocument>
	),
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="ko">
			<head>
				<HeadContent />
			</head>
			<body className="bg-background text-foreground min-h-svh font-[Pretendard,sans-serif] antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
