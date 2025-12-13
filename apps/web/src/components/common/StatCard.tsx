import { Card, CardContent, CardHeader, CardTitle } from "@jwc/ui";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
	/** 통계 제목 */
	title: string;
	/** 통계 값 */
	value: string | number;
	/** 단위 (예: "명", "건") */
	unit?: string;
	/** 설명 */
	description?: string;
	/** 아이콘 */
	icon?: LucideIcon;
	/** 아이콘 색상 클래스 */
	iconColor?: string;
}

/**
 * 통계 카드 컴포넌트
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="총 신청자"
 *   value={150}
 *   unit="명"
 *   description="현재까지 접수된 인원"
 *   icon={Users}
 * />
 * ```
 */
export function StatCard({
	title,
	value,
	unit,
	description,
	icon: Icon,
	iconColor = "text-muted-foreground",
}: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				{Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">
					{value}
					{unit}
				</div>
				{description && (
					<p className="text-muted-foreground text-xs">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

interface StatGridProps {
	children: ReactNode;
	/** 컬럼 수 (기본: 3) */
	columns?: 2 | 3 | 4;
}

const columnMap = {
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-3",
	4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * 통계 그리드 컨테이너
 *
 * @example
 * ```tsx
 * <StatGrid columns={3}>
 *   <StatCard title="총 신청자" value={150} />
 *   <StatCard title="등록 완료" value={120} />
 *   <StatCard title="입금 대기" value={30} />
 * </StatGrid>
 * ```
 */
export function StatGrid({ children, columns = 3 }: StatGridProps) {
	return (
		<div className={`mb-8 grid gap-4 ${columnMap[columns]}`}>{children}</div>
	);
}
