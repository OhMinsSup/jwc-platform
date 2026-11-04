import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { z } from "zod";

import { PublicShell } from "../../../components/shell";

export const Route = createFileRoute("/f/$slug/done")({
	validateSearch: z.object({
		id: z.string().max(40),
		updated: z.boolean().optional(),
	}),
	component: DonePage,
});

function DonePage() {
	const { id, updated } = Route.useSearch();
	return (
		<PublicShell>
			<div className="flex flex-col items-center gap-4 py-16 text-center">
				<CircleCheck className="text-primary h-14 w-14" />
				<h1 className="text-2xl font-bold">
					{updated ? "신청 내용이 수정되었습니다" : "신청이 완료되었습니다"}
				</h1>
				<p className="text-muted-foreground">
					입력하신 연락처로 안내 문자가 발송됩니다.
				</p>
				<Button
					nativeButton={false}
					render={<Link params={{ id }} to="/r/$id" />}
					variant="outline"
				>
					신청 내역 보기
				</Button>
			</div>
		</PublicShell>
	);
}
