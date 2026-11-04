import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { z } from "zod";

import { PublicShell } from "../../../platform/ui/public-shell";

export const Route = createFileRoute("/f/$slug/done")({
	validateSearch: z.object({
		id: z.string().max(40),
		updated: z.boolean().optional(),
	}),
	component: DonePage,
});

/** 완료 화면: 가운데 큰 제목 하나 + 다음 할 일(신청 내역 보기) 한 개. 초록은 "완료" 상태에만 쓴다 */
function DonePage() {
	const { id, updated } = Route.useSearch();
	return (
		<PublicShell>
			<div className="flex flex-col items-center py-16 text-center sm:py-24">
				<CircleCheck aria-hidden className="text-success h-12 w-12" />
				<h1 className="font-display mt-6 text-[30px] leading-tight font-bold tracking-[-0.03em] text-balance sm:text-[40px]">
					{updated ? "신청 내용이 수정되었습니다" : "신청이 완료되었습니다"}
				</h1>
				<p className="text-muted-foreground mt-3 text-base">
					입력하신 연락처로 안내 문자가 발송됩니다.
				</p>
				<Button
					className="mt-10 h-11 rounded-full px-6 text-[15px] font-semibold"
					nativeButton={false}
					render={<Link params={{ id }} to="/r/$id" />}
				>
					신청 내역 보기
				</Button>
			</div>
		</PublicShell>
	);
}
