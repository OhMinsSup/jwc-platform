import type React from "react";
import { AppLayout } from "~/components/layouts/AppLayout";

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	return <AppLayout>{children}</AppLayout>;
}
