import type React from "react";

interface ContentLayoutProps {
	children: React.ReactNode;
}

export default function ContentLayout({ children }: ContentLayoutProps) {
	return (
		<>
			<section className="container relative grid h-svh flex-col items-center md:px-8 lg:max-w-3xl xl:px-0">
				<div className="w-full px-4 sm:px-0">{children}</div>
			</section>
		</>
	);
}
