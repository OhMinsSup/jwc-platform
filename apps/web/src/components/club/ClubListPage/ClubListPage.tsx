"use client";

import { Card, CardContent, Icons } from "@jwc/ui";
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
								<Icons.User className="h-6 w-6 text-blue-600" />
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
