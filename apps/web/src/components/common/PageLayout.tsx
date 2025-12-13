import { cn } from "@jwc/ui";
import type { ReactNode } from "react";

interface PageLayoutProps {
	/** 페이지 내용 */
	children: ReactNode;
	/** 헤더 영역 (Navbar 등) */
	header?: ReactNode;
	/** 푸터 영역 */
	footer?: ReactNode;
	/** 배경 스타일 클래스 */
	className?: string;
}

/**
 * 공통 페이지 레이아웃 컴포넌트
 *
 * @example
 * ```tsx
 * <PageLayout header={<Navbar />}>
 *   <PageContainer>
 *     <h1>페이지 제목</h1>
 *   </PageContainer>
 * </PageLayout>
 * ```
 */
export function PageLayout({
	children,
	header,
	footer,
	className,
}: PageLayoutProps) {
	return (
		<div className={cn("flex min-h-svh flex-col bg-muted/5", className)}>
			{header}
			<main className="flex-1">{children}</main>
			{footer}
		</div>
	);
}

interface PageContainerProps {
	children: ReactNode;
	/** 최대 너비 (기본: max-w-6xl) */
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
	/** 수직 패딩 (기본: py-8 md:py-12) */
	className?: string;
}

const maxWidthMap = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"3xl": "max-w-3xl",
	"4xl": "max-w-4xl",
	"5xl": "max-w-5xl",
	"6xl": "max-w-6xl",
};

/**
 * 페이지 컨테이너 컴포넌트
 *
 * @example
 * ```tsx
 * <PageContainer maxWidth="2xl">
 *   <h1>컨텐츠</h1>
 * </PageContainer>
 * ```
 */
export function PageContainer({
	children,
	maxWidth = "6xl",
	className,
}: PageContainerProps) {
	return (
		<div
			className={cn(
				"container mx-auto px-4 py-8 md:py-12",
				maxWidthMap[maxWidth],
				className
			)}
		>
			{children}
		</div>
	);
}

interface PageHeaderProps {
	/** 페이지 제목 */
	title: string;
	/** 부제목/설명 */
	description?: string;
	/** 우측 액션 영역 */
	actions?: ReactNode;
}

/**
 * 페이지 헤더 컴포넌트
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="신청 내역 조회"
 *   description="등록된 수련회 신청 내역을 확인하세요."
 *   actions={<Button>새로고침</Button>}
 * />
 * ```
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">{title}</h1>
				{description && (
					<p className="mt-2 text-muted-foreground">{description}</p>
				)}
			</div>
			{actions && <div className="self-start md:self-auto">{actions}</div>}
		</div>
	);
}
