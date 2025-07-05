import { Card, CardContent, CardHeader, CardTitle, Icons } from "@jwc/ui";
import React from "react";
import type { ClubInfoHeaderProps } from "../types";

/**
 * 클럽 정보 헤더 컴포넌트
 */
export const ClubInfoHeader = React.memo<ClubInfoHeaderProps>(
	({ club, clubDescription }) => (
		<Card className="mb-8 shadow-lg">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Icons.User className="h-6 w-6 text-primary" />
						</div>
						<div>
							<CardTitle className="text-2xl">{club.title}</CardTitle>
						</div>
					</div>
				</div>
			</CardHeader>
			{clubDescription && (
				<CardContent className="pt-0">
					<div className="rounded-lg bg-muted/50 p-4">
						<h3 className="mb-3 font-semibold text-base">동아리 소개</h3>
						<div className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
							{clubDescription}
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	)
);

ClubInfoHeader.displayName = "ClubInfoHeader";
