import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
	fetchSession,
	getCookieName,
} from "@convex-dev/better-auth/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { createAuth } from "@jwc/backend/convex/auth";
import appCss from "@jwc/ui/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import type { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
	const { session } = await fetchSession(getRequest());
	const sessionCookieName = getCookieName(createAuth);
	const token = getCookie(sessionCookieName);
	return {
		userId: session?.user.id,
		token,
	};
});

export interface RouterAppContext {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "robots",
				content: "noindex, nofollow",
			},
			{
				title: "2026 동계 청년부 수련회 - 멸종위기사랑",
			},
			{
				name: "description",
				content:
					"2026년 1월 8일(목) ~ 1월 11일(일) 광림 수도원에서 진행되는 청년부 수련회에 초대합니다.",
			},
			{
				name: "keywords",
				content:
					"청년부, 수련회, 2026, 동계수련회, 멸종위기사랑, 광림수도원, 교회수련회",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:title",
				content: "2026 동계 청년부 수련회 - 멸종위기사랑",
			},
			{
				property: "og:description",
				content:
					"2026년 1월 8일(목) ~ 1월 11일(일) 광림 수도원에서 진행되는 청년부 수련회에 초대합니다.",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "2026 동계 청년부 수련회 - 멸종위기사랑",
			},
			{
				name: "twitter:description",
				content:
					"2026년 1월 8일(목) ~ 1월 11일(일) 광림 수도원에서 진행되는 청년부 수련회에 초대합니다.",
			},
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
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),

	component: RootDocument,
	beforeLoad: async (ctx) => {
		const { token, userId } = await fetchAuth();
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}
		return { userId, token };
	},
});

function RootDocument() {
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			authClient={authClient}
			client={context.convexClient}
		>
			<html lang="ko">
				{/** biome-ignore lint/style/noHeadElement: <explanation> Head */}
				<head>
					<HeadContent />
				</head>
				<body>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Outlet />
					</div>
					<TanStackRouterDevtools position="bottom-left" />
					<Scripts />
				</body>
			</html>
		</ConvexBetterAuthProvider>
	);
}
