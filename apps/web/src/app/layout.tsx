import "@jwc/ui/globals.css";
import "./globals.css";
import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type React from "react";

import type { Viewport } from "next";

import { Toaster, cn } from "@jwc/ui";
import { ThemeProvider } from "~/components/common/Theme";
import { ORPCReactProvider } from "~/libs/orpc/react";

interface LayoutProps {
	children: React.ReactNode;
}

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

setDayjsLocale();
setDayjsPlugin();

export default function Layout({ children }: LayoutProps) {
	return (
		<html lang="ko" suppressHydrationWarning>
			<body
				className={cn(
					"bg-background font-sans text-foreground antialiased",
					GeistSans.variable,
					GeistMono.variable
				)}
			>
				<ORPCReactProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						{children}
						<Toaster />
					</ThemeProvider>
				</ORPCReactProvider>
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}
