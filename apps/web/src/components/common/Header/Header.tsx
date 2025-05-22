import type React from "react";

interface HeaderProps {
	left?: React.ReactNode;
	center?: React.ReactNode;
	right?: React.ReactNode;
}

export default function Header({ left, right, center }: HeaderProps) {
	return (
		<header className="absolute top-0 z-50 flex w-full flex-shrink flex-row items-stretch justify-start">
			<div className="relative flex h-[62px] w-full flex-shrink flex-col overflow-visible bg-background">
				<div className="relative flex size-full max-w-full flex-shrink flex-row items-center justify-between self-center px-5 py-3 lg:max-w-[1312px] lg:px-10">
					{left}
					{center}
					{right}
				</div>
			</div>
		</header>
	);
}
