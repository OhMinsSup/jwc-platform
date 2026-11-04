import { Button } from "@jwc/ui/components/button";
import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function NotFound() {
	return (
		<CenteredMessage
			description="주소를 다시 확인해주세요."
			title="페이지를 찾을 수 없습니다"
		>
			<Button nativeButton={false} render={<Link to="/" />} variant="outline">
				처음으로
			</Button>
		</CenteredMessage>
	);
}

export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<CenteredMessage
			description={
				error instanceof Error && error.message
					? error.message
					: "잠시 후 다시 시도해주세요."
			}
			title="문제가 발생했습니다"
		>
			<Button onClick={reset} variant="outline">
				다시 시도
			</Button>
		</CenteredMessage>
	);
}

export function CenteredMessage({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
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
