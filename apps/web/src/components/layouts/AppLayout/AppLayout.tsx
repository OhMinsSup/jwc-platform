"use client";
import { Button, Icons, Progress, buttonVariants } from "@jwc/ui";
import Link from "next/link";
import type React from "react";
import { useStepProgressAtomHook } from "~/atoms/stepAtom";
import { Header } from "~/components/common/Header";
import { ThemeToggle } from "~/components/common/Theme";

interface AppLayoutProps {
	children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
	const { progress } = useStepProgressAtomHook();

	return (
		<>
			<Progress
				value={progress}
				className="fixed top-0 z-[100] h-1 rounded-none bg-background"
			/>
			<Header
				right={
					<div className="relative flex flex-1 flex-row items-center justify-end space-x-2">
						<Link
							href={"https://github.com/OhMinsSup/"}
							arial-label="깃헙 사이트로 이동하기"
							target="_blank"
							rel="noopener noreferrer"
							className={buttonVariants({
								variant: "ghost",
								size: "icon",
							})}
						>
							<Icons.Github className="h-4 w-4" />
						</Link>
						<ThemeToggle />
					</div>
				}
			/>
			<main className="size-full">{children}</main>
		</>
	);
}
