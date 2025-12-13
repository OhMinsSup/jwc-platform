import { cn } from "@jwc/ui";

interface LoadingSpinnerProps {
	/** 스피너 크기 (기본: md) */
	size?: "sm" | "md" | "lg";
	/** 로딩 메시지 */
	message?: string;
	/** 추가 클래스 */
	className?: string;
}

const sizeMap = {
	sm: "h-4 w-4 border-2",
	md: "h-8 w-8 border-4",
	lg: "h-12 w-12 border-4",
};

/**
 * 로딩 스피너 컴포넌트
 *
 * @example
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" message="불러오는 중..." />
 * ```
 */
export function LoadingSpinner({
	size = "md",
	message,
	className,
}: LoadingSpinnerProps) {
	return (
		<div className={cn("flex flex-col items-center gap-4", className)}>
			<div
				className={cn(
					"animate-spin rounded-full border-primary border-t-transparent",
					sizeMap[size]
				)}
			/>
			{message && <p className="text-muted-foreground">{message}</p>}
		</div>
	);
}

interface FullPageLoadingProps {
	/** 로딩 메시지 */
	message?: string;
}

/**
 * 전체 페이지 로딩 컴포넌트
 *
 * @example
 * ```tsx
 * <FullPageLoading message="데이터를 불러오는 중..." />
 * ```
 */
export function FullPageLoading({
	message = "불러오는 중...",
}: FullPageLoadingProps) {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background">
			<LoadingSpinner message={message} size="md" />
		</div>
	);
}

interface ContentLoadingProps {
	/** 로딩 메시지 */
	message?: string;
	/** 컨테이너 높이 */
	height?: string;
}

/**
 * 컨텐츠 영역 로딩 컴포넌트
 *
 * @example
 * ```tsx
 * <ContentLoading message="데이터를 불러오는 중입니다..." />
 * ```
 */
export function ContentLoading({
	message = "데이터를 불러오는 중입니다...",
	height = "h-64",
}: ContentLoadingProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-xl border bg-card/50",
				height
			)}
		>
			<LoadingSpinner message={message} size="md" />
		</div>
	);
}
