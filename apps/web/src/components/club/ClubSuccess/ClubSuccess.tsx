"use client";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Icons,
	Separator,
} from "@jwc/ui";
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
						<Icons.Check className="h-8 w-8 text-green-600" />
					</div>
					<CardTitle className="text-2xl text-green-700">
						신청이 완료되었습니다!
					</CardTitle>
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
							<Icons.ListTodo className="h-4 w-4" />
							동아리 목록으로
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
