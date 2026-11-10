import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BRAND_NAME, BRAND_TAGLINE } from "../brand";
import { AppIcon } from "./brand-mark";

/** 머리/바닥 줄의 폭. 본문 폭(width)과 따로 두어 어느 화면에서나 같은 자리에 표식이 온다 */
const FRAME_WIDTH = "max-w-5xl";

/**
 * 공개 화면 틀 (typie 머리 구조): 왼쪽 앱 아이콘 + 서비스 이름, 선 없는 머리, 넉넉한 여백.
 * 바닥은 서비스 소개와 신청자가 가장 많이 찾는 안내(신청 내역 확인 방법)를 둔다.
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
			<PublicHeader />
			<main className={`mx-auto w-full flex-1 px-5 pt-8 pb-20 ${width}`}>
				{children}
			</main>
			<PublicFooter />
		</div>
	);
}

function PublicHeader() {
	return (
		<header className="bg-background/85 sticky top-0 z-30 backdrop-blur">
			<div
				className={`mx-auto flex h-16 items-center justify-between px-5 ${FRAME_WIDTH}`}
			>
				<Link
					aria-label={`${BRAND_NAME} 처음 화면`}
					className="focus-visible:ring-ring -ml-1 flex items-center gap-2 rounded-md px-1 py-1 focus-visible:ring-2 focus-visible:outline-none"
					to="/"
				>
					<AppIcon className="h-7 w-7" />
					<span className="font-display text-[17px] font-bold tracking-[-0.02em]">
						{BRAND_NAME}
					</span>
				</Link>
				<Link
					className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
					to="/"
				>
					신청서 목록
				</Link>
			</div>
		</header>
	);
}

function PublicFooter() {
	return (
		<footer className="border-rule border-t">
			<div
				className={`mx-auto flex flex-col gap-2 px-5 py-6 text-[13px] sm:flex-row sm:items-center sm:justify-between ${FRAME_WIDTH}`}
			>
				<p className="flex items-center gap-2">
					<AppIcon className="h-5 w-5" />
					<span className="font-semibold">{BRAND_NAME}</span>
					<span className="text-faint-foreground">{BRAND_TAGLINE}</span>
				</p>
				<p className="text-faint-foreground">
					신청 내역은 신청 후 받은 문자의 링크에서 확인할 수 있습니다.
				</p>
			</div>
		</footer>
	);
}
