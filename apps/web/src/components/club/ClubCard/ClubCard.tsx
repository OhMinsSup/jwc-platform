"use client";

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Icons,
	Skeleton,
} from "@jwc/ui";
import { useRouter } from "next/navigation";
import React, { useCallback, useTransition } from "react";
import type { Club } from "~/types/club";

interface ClubProps {
	data: Club;
}

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
							<Icons.User className="size-5" />
						</div>
						<div>
							<CardTitle className="text-lg">{data.title}</CardTitle>
						</div>
					</div>
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
					aria-label={isPending ? "이동중..." : `${data.title} 동아리 선택하기`}
				>
					{isPending ? (
						<>
							<Icons.Loader2 className="h-4 w-4 animate-spin" />
							이동중...
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
