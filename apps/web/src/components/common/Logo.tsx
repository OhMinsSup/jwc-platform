import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

interface LogoIconProps {
	className?: string;
}

export function LogoIcon({ className = "h-5 w-5" }: LogoIconProps) {
	return (
		<svg
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>JWC Retreat Logo</title>
			<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
		</svg>
	);
}

interface LogoProps extends Omit<ComponentProps<typeof Link>, "to"> {
	to?: ComponentProps<typeof Link>["to"];
	showText?: boolean;
	children?: ReactNode;
}

export function Logo({
	to = "/",
	showText = true,
	className = "",
	children,
	...props
}: LogoProps) {
	return (
		<Link
			className={`flex items-center gap-2 font-bold text-xl tracking-tight ${className}`}
			to={to}
			{...props}
		>
			<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<LogoIcon />
			</div>
			{showText && <span>JWC Retreat</span>}
			{children}
		</Link>
	);
}
