import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { TicketMark } from "./brand-mark";

/** 머리/바닥 줄의 폭. 본문 폭(width)과 따로 두어 어느 화면에서나 같은 자리에 표식이 온다 */
const FRAME_WIDTH = "max-w-5xl";

/**
 * 공개 화면 틀 (typie 머리 구조): 왼쪽 표식 + 이름, 선 없는 머리, 넉넉한 여백, 작은 바닥 줄.
 * 본문 폭은 화면마다 다르다 (목록은 넓게, 입력은 좁게).
 */
export function PublicShell({
	children,
	width = "max-w-2xl",
}: {
	children: ReactNode;
	width?: string;
}) {
	return (
		<div className="flex min-h-svh flex-col">
			<header className="bg-background sticky top-0 z-30">
				<div
					className={`mx-auto flex h-16 items-center justify-between px-5 ${FRAME_WIDTH}`}
				>
					<Link className="flex items-center gap-2" to="/">
						<TicketMark className="text-foreground h-6 w-6" />
						<span className="text-[15px] font-bold">JWC 청년부</span>
					</Link>
					<Link
						className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
						to="/"
					>
						신청서 목록
					</Link>
				</div>
			</header>
			<main className={`mx-auto w-full flex-1 px-5 pt-8 pb-20 ${width}`}>
				{children}
			</main>
			<footer className="border-rule border-t">
				<div
					className={`text-faint-foreground mx-auto flex h-14 items-center px-5 text-[13px] ${FRAME_WIDTH}`}
				>
					죽전우리교회 청년부
				</div>
			</footer>
		</div>
	);
}
