import type { ReactNode } from "react";

/** 화면 가운데 제목 + 설명 + 동작 (빈 화면, 오류, 마감 안내) */
export function CenteredMessage({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
			<h1 className="text-xl font-bold">{title}</h1>
			{description && (
				<p className="text-muted-foreground max-w-md text-sm">{description}</p>
			)}
			{children}
		</div>
	);
}
