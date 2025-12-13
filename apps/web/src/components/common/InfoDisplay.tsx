import { cn } from "@jwc/ui";
import type { ReactNode } from "react";

interface InfoRowProps {
	/** 라벨 */
	label: string;
	/** 값 */
	value: ReactNode;
	/** 추가 클래스 */
	className?: string;
}

/**
 * 정보 행 컴포넌트 (라벨 + 값)
 *
 * @example
 * ```tsx
 * <InfoRow label="이름" value="홍길동" />
 * <InfoRow label="상태" value={<Badge>완료</Badge>} />
 * ```
 */
export function InfoRow({ label, value, className }: InfoRowProps) {
	return (
		<div className={cn("grid grid-cols-2 gap-1", className)}>
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}

interface InfoBlockProps {
	/** 라벨 */
	label: string;
	/** 값 (여러 줄 가능) */
	value: ReactNode;
	/** 추가 클래스 */
	className?: string;
}

/**
 * 정보 블록 컴포넌트 (라벨 위, 값 아래)
 *
 * @example
 * ```tsx
 * <InfoBlock label="메모" value="긴 설명 텍스트..." />
 * ```
 */
export function InfoBlock({ label, value, className }: InfoBlockProps) {
	return (
		<div className={cn("col-span-2 mt-2", className)}>
			<span className="block text-muted-foreground">{label}</span>
			<p className="mt-1 font-medium">{value}</p>
		</div>
	);
}

interface InfoGridProps {
	children: ReactNode;
	className?: string;
}

/**
 * 정보 그리드 컨테이너
 *
 * @example
 * ```tsx
 * <InfoGrid>
 *   <InfoRow label="이름" value="홍길동" />
 *   <InfoRow label="부서" value="청년1부" />
 * </InfoGrid>
 * ```
 */
export function InfoGrid({ children, className }: InfoGridProps) {
	return <div className={cn("grid gap-4 text-sm", className)}>{children}</div>;
}
