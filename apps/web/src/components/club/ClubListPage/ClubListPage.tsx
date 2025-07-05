"use client";

import { Card, CardContent } from "@jwc/ui/components/shadcn/card";
import { Suspense } from "react";
import { ClubCardList } from "~/components/club/ClubCardList";

export default function ClubListPage() {
	return (
		<div className="container mx-auto mt-10 max-w-4xl px-4 py-8">
			<Card className="shadow-lg">
				<CardContent className="p-8">
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

						<Suspense fallback={<ClubCardList.Skeleton />}>
							<ClubCardList />
						</Suspense>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
