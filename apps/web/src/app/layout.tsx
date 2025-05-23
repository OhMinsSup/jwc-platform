"use client";
import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import type React from "react";

setDayjsLocale();
setDayjsPlugin();

type LayoutProps = {
	children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
	return <>{children}</>;
}
