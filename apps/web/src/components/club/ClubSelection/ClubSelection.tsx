"use client";

import { Badge } from "@jwc/ui/components/shadcn/badge";
import { Button } from "@jwc/ui/components/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jwc/ui/components/shadcn/card";
import { Skeleton } from "@jwc/ui/components/shadcn/skeleton";
import { useEffect, useState } from "react";
import type { Club } from "~/types/club";

interface ClubSelectionProps {
	onClubSelectAction: (clubId: string) => void;
	selectedClubId?: string;
}

export function ClubSelection({
	onClubSelectAction,
	selectedClubId,
}: ClubSelectionProps) {
	const [clubs, setClubs] = useState<Club[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// TODO: Payload API에서 동아리 목록 조회
		const fetchClubs = async () => {
			try {
				// const response = await fetch('/api/clubs');
				// const data = await response.json();
				// setClubs(data.docs);

				// 임시 데이터
				setClubs([
					{
						id: "1",
						title: "찬양팀",
						content: "매주 주일 찬양을 담당하는 팀입니다.",
						components: [],
						clubForms: [],
					},
					{
						id: "2",
						title: "미디어팀",
						content: "영상 편집과 라이브 스트리밍을 담당합니다.",
						components: [],
						clubForms: [],
					},
				]);
			} catch (error) {
				console.error("Failed to fetch clubs:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchClubs();
	}, []);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="space-y-2 text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
					</div>
					<h2 className="font-bold text-2xl">동아리 선택</h2>
					<p className="text-muted-foreground">동아리 목록을 불러오는 중...</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-full" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
					<svg
						className="h-6 w-6 text-blue-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>동아리</title>
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">동아리 선택</h2>
				<p className="text-muted-foreground">
					참여하고 싶은 동아리를 선택해주세요
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{clubs.map((club) => (
					<Card
						key={club.id}
						className={`group hover:-translate-y-1 cursor-pointer transition-all duration-200 hover:shadow-lg ${
							selectedClubId === club.id
								? "border-primary bg-primary/5 ring-2 ring-primary"
								: "hover:border-primary/50"
						}`}
						onClick={() => onClubSelectAction(club.id)}
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors${
											selectedClubId === club.id
												? "bg-primary text-primary-foreground"
												: "bg-muted group-hover:bg-primary/10"
										}
									`}
									>
										<svg
											className="h-5 w-5"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<title>동아리 아이콘</title>
											<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
										</svg>
									</div>
									<div>
										<CardTitle className="text-lg">{club.title}</CardTitle>
									</div>
								</div>
								{selectedClubId === club.id && (
									<Badge variant="default" className="shrink-0">
										<svg
											className="mr-1 h-3 w-3"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<title>체크 아이콘</title>
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
										선택됨
									</Badge>
								)}
							</div>
							<CardDescription className="text-left">
								{club.content}
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<Button
								variant={selectedClubId === club.id ? "default" : "outline"}
								className="w-full"
								onClick={(e) => {
									e.stopPropagation();
									onClubSelectAction(club.id);
								}}
							>
								{selectedClubId === club.id ? (
									<>
										<svg
											className="mr-2 h-4 w-4"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<title>체크 아이콘</title>
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
										선택됨
									</>
								) : (
									"선택하기"
								)}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
