"use client";

import { Skeleton } from "@jwc/ui";
import { Badge } from "@jwc/ui/components/shadcn/badge";
import { Button } from "@jwc/ui/components/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jwc/ui/components/shadcn/card";
import { useRouter } from "next/navigation";
import React, { useCallback, useTransition } from "react";
import type { Club } from "~/types/club";

interface ClubProps {
	data: Club;
}

// 아이콘 컴포넌트를 메모이제이션
const ClubIcon = React.memo(() => (
	<svg
		className="h-5 w-5"
		fill="currentColor"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<title>동아리 아이콘</title>
		<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
	</svg>
));

const CheckIcon = React.memo(() => (
	<svg
		className="mr-1 h-3 w-3"
		fill="currentColor"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<title>체크 아이콘</title>
		<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
	</svg>
));

ClubIcon.displayName = "ClubIcon";
CheckIcon.displayName = "CheckIcon";

export default function ClubCard({ data }: ClubProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	// useCallback으로 함수 메모이제이션
	const handleClubPageNavigation = useCallback(
		(clubId: string | number) => {
			startTransition(() => {
				router.push(`/form/club/${clubId}`);
			});
		},
		[router]
	);

	// 이벤트 핸들러 메모이제이션
	const handleCardClick = useCallback(() => {
		handleClubPageNavigation(data.id);
	}, [handleClubPageNavigation, data.id]);

	const handleButtonClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			handleClubPageNavigation(data.id);
		},
		[handleClubPageNavigation, data.id]
	);

	// CSS 클래스 계산을 메모이제이션
	const cardClassName = `
		group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
		${
			isPending
				? "border-primary bg-primary/5 ring-2 ring-primary"
				: "hover:border-primary/50"
		}
	`
		.trim()
		.replace(/\s+/g, " ");

	const iconContainerClassName = `
		flex h-10 w-10 items-center justify-center rounded-full transition-colors
		${
			isPending
				? "bg-primary text-primary-foreground"
				: "bg-muted group-hover:bg-primary/10"
		}
	`
		.trim()
		.replace(/\s+/g, " ");

	return (
		<Card
			className={cardClassName}
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCardClick();
				}
			}}
			tabIndex={0}
			aria-label={`${data.title} 동아리 선택`}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className={iconContainerClassName}>
							<ClubIcon />
						</div>
						<div>
							<CardTitle className="text-lg">{data.title}</CardTitle>
						</div>
					</div>
					{isPending && (
						<Badge variant="default" className="shrink-0">
							<CheckIcon />
							선택됨
						</Badge>
					)}
				</div>
				<CardDescription className="text-left">{data.title}</CardDescription>
			</CardHeader>
			<CardContent className="pt-0">
				<Button
					type="button"
					variant={isPending ? "default" : "outline"}
					className="w-full"
					onClick={handleButtonClick}
					disabled={isPending}
					aria-label={isPending ? "선택됨" : `${data.title} 동아리 선택하기`}
				>
					{isPending ? (
						<>
							<CheckIcon />
							선택됨
						</>
					) : (
						"선택하기"
					)}
				</Button>
			</CardContent>
		</Card>
	);
}

// Skeleton 컴포넌트 최적화
ClubCard.Skeleton = React.memo(function ClubCardSkeleton() {
	return (
		<Card className="animate-pulse">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-32" />
						</div>
					</div>
				</div>
				<Skeleton className="h-4 w-full" />
			</CardHeader>
			<CardContent className="pt-0">
				<Skeleton className="h-10 w-full rounded-md" />
			</CardContent>
		</Card>
	);
});
