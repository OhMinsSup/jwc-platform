import { Badge, cn } from "@jwc/ui";

type StatusType = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
	/** 상태 타입 */
	type: StatusType;
	/** 표시할 텍스트 */
	children: React.ReactNode;
	/** 추가 클래스 */
	className?: string;
}

const statusStyles: Record<StatusType, string> = {
	success: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
	warning: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
	error: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
	info: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
	neutral: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
};

/**
 * 상태 배지 컴포넌트
 *
 * @example
 * ```tsx
 * <StatusBadge type="success">등록 완료</StatusBadge>
 * <StatusBadge type="warning">입금 대기</StatusBadge>
 * ```
 */
export function StatusBadge({ type, children, className }: StatusBadgeProps) {
	return (
		<Badge className={cn(statusStyles[type], className)} variant="secondary">
			{children}
		</Badge>
	);
}

interface PaymentStatusBadgeProps {
	/** 결제 완료 여부 */
	isPaid: boolean;
	/** 추가 클래스 */
	className?: string;
}

/**
 * 결제 상태 배지 컴포넌트
 *
 * @example
 * ```tsx
 * <PaymentStatusBadge isPaid={true} />  // "등록 완료"
 * <PaymentStatusBadge isPaid={false} /> // "입금 대기"
 * ```
 */
export function PaymentStatusBadge({
	isPaid,
	className,
}: PaymentStatusBadgeProps) {
	return (
		<StatusBadge className={className} type={isPaid ? "success" : "warning"}>
			{isPaid ? "등록 완료" : "입금 대기"}
		</StatusBadge>
	);
}
