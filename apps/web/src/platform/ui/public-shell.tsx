import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PublicShell({
	children,
	width = "max-w-2xl",
}: {
	children: ReactNode;
	width?: string;
}) {
	return (
		<div className="flex min-h-svh flex-col">
			<header className="border-b">
				<div className={`mx-auto flex h-14 items-center px-4 ${width}`}>
					<Link className="font-bold" to="/">
						JWC 청년부
					</Link>
				</div>
			</header>
			<main className={`mx-auto w-full flex-1 px-4 py-10 ${width}`}>
				{children}
			</main>
		</div>
	);
}
