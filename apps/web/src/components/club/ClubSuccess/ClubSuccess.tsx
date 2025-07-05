"use client";
import { Separator } from "@jwc/ui";
import { Badge } from "@jwc/ui/components/shadcn/badge";
import { Button } from "@jwc/ui/components/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jwc/ui/components/shadcn/card";
import { useRouter } from "next/navigation";
import React from "react";

interface SuccessPageProps {
	id: string;
}

export default function ClubSuccess({ id }: SuccessPageProps) {
	const router = useRouter();

	return (
		<div className="container mx-auto mt-10 max-w-2xl px-4 py-8">
			<Card className="shadow-lg">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<svg
							className="h-8 w-8 text-green-600"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<title>성공</title>
							<path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
						</svg>
					</div>
					<CardTitle className="text-2xl text-green-700">
						신청이 완료되었습니다!
					</CardTitle>
					<Badge variant="secondary" className="mx-auto mt-2 w-fit">
						접수 완료
					</Badge>
				</CardHeader>
				<CardContent className="space-y-6">
					<Separator />

					<div className="space-y-4 text-center">
						<div className="rounded-lg bg-green-50 p-4">
							<p className="text-green-700 text-sm">
								동아리 신청서가 성공적으로 제출되었습니다.
							</p>
						</div>

						<div className="space-y-2 text-muted-foreground text-sm">
							<p>• 신청서 검토 후 연락드리겠습니다.</p>
						</div>
					</div>

					<Separator />

					<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/form/club")}
							className="flex items-center gap-2"
						>
							<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<title>목록</title>
								<path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.18L9.59,12.59L11,14L5,20Z" />
							</svg>
							동아리 목록으로
						</Button>

						<Button
							type="button"
							onClick={() => router.push("/")}
							className="flex items-center gap-2"
						>
							<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<title>홈</title>
								<path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
							</svg>
							홈으로 이동
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
