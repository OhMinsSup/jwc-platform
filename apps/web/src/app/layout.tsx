"use client";
import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type React from "react";

setDayjsLocale();
setDayjsPlugin();

type LayoutProps = {
	children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			{children}
			<SpeedInsights />
			<Analytics />
		</>
	);
}
