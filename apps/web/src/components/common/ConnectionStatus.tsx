import { cn } from "@jwc/ui";

interface ConnectionStatusProps {
	/** 연결 여부 */
	isConnected: boolean;
	/** 로딩 중 여부 */
	isLoading?: boolean;
	/** 연결됨 텍스트 */
	connectedText?: string;
	/** 연결 끊김 텍스트 */
	disconnectedText?: string;
	/** 로딩 텍스트 */
	loadingText?: string;
	/** 추가 클래스 */
	className?: string;
}

/**
 * 연결 상태 표시 컴포넌트
 *
 * @example
 * ```tsx
 * <ConnectionStatus
 *   isConnected={true}
 *   connectedText="신청 접수 중"
 *   disconnectedText="서버 점검 중"
 * />
 * ```
 */
export function ConnectionStatus({
	isConnected,
	isLoading = false,
	connectedText = "연결됨",
	disconnectedText = "연결 끊김",
	loadingText = "연결 중...",
	className,
}: ConnectionStatusProps) {
	const statusColor = isConnected ? "bg-green-500" : "bg-orange-500";
	const pingColor = isConnected ? "bg-green-400" : "bg-orange-400";

	const getStatusText = () => {
		if (isLoading) {
			return loadingText;
		}
		if (isConnected) {
			return connectedText;
		}
		return disconnectedText;
	};

	const statusText = getStatusText();

	return (
		<div
			className={cn(
				"hidden items-center gap-2 text-muted-foreground text-xs sm:flex",
				className
			)}
		>
			<span className="relative flex h-2 w-2">
				<span
					className={cn(
						"absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
						pingColor
					)}
				/>
				<span
					className={cn(
						"relative inline-flex h-2 w-2 rounded-full",
						statusColor
					)}
				/>
			</span>
			{statusText}
		</div>
	);
}
