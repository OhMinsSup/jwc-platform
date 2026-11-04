import { Button } from "@jwc/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@jwc/ui/components/sheet";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, LogOut, Menu, UsersRound } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { resetAnalytics } from "../analytics/client";
import { authClient } from "../auth-client";

/** 사이드바 메뉴. 화면이 늘면 이 표에 한 줄 추가한다 */
const NAV_ITEMS = [
	{ to: "/admin", label: "폼", icon: FileText },
	{ to: "/admin/admins", label: "관리자", icon: UsersRound },
] as const;
type NavTarget = (typeof NAV_ITEMS)[number]["to"];

/**
 * 현재 메뉴 = 경로 앞부분이 가장 길게 맞는 항목.
 * Link의 기본 판정(앞부분 일치)은 "/admin"이 모든 하위 화면에서 켜지고, exact는 폼 상세에서 꺼지므로 직접 고른다.
 */
function currentNavTarget(pathname: string): NavTarget | null {
	let best: NavTarget | null = null;
	for (const { to } of NAV_ITEMS) {
		const matches = pathname === to || pathname.startsWith(`${to}/`);
		if (matches && (best === null || to.length > best.length)) {
			best = to;
		}
	}
	return best;
}

interface AdminUser {
	email: string;
	name: string;
}

function BrandMark() {
	return (
		<Link
			className="focus-visible:ring-ring flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:outline-none"
			to="/admin"
		>
			<span
				aria-hidden
				className="bg-brand text-brand-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
			>
				J
			</span>
			<span className="leading-tight">
				<span className="block text-sm font-semibold">JWC Forms</span>
				<span className="text-muted-foreground block text-xs">
					청년부 신청서 관리
				</span>
			</span>
		</Link>
	);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
	const current = currentNavTarget(
		useLocation({ select: (location) => location.pathname }),
	);
	return (
		<nav aria-label="관리자 메뉴">
			<ul className="space-y-0.5">
				{NAV_ITEMS.map(({ to, label, icon: Icon }) => (
					<li key={to}>
						<Link
							activeOptions={{ exact: true }}
							aria-current={current === to ? "page" : undefined}
							className="text-muted-foreground hover:bg-muted hover:text-foreground data-[current=true]:bg-brand-soft data-[current=true]:text-brand flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors data-[current=true]:font-medium"
							data-current={current === to}
							onClick={onNavigate}
							to={to}
						>
							<Icon aria-hidden className="h-4 w-4" />
							{label}
						</Link>
					</li>
				))}
				<li>
					<a
						className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm"
						href="/"
						rel="noreferrer"
						target="_blank"
					>
						<ExternalLink aria-hidden className="h-4 w-4" />
						공개 사이트
						<span className="sr-only">(새 창)</span>
					</a>
				</li>
			</ul>
		</nav>
	);
}

function AccountFooter({ admin }: { admin: AdminUser }) {
	const navigate = useNavigate();
	const signOut = async () => {
		await authClient.signOut();
		resetAnalytics();
		await navigate({ to: "/admin/login" });
	};
	const initial = (admin.name || admin.email).slice(0, 1).toUpperCase();
	return (
		<div className="flex items-center gap-2.5 border-t pt-4">
			<span
				aria-hidden
				className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
			>
				{initial}
			</span>
			<span className="min-w-0 flex-1 leading-tight">
				<span className="block truncate text-sm font-medium">
					{admin.name || "관리자"}
				</span>
				<span className="text-muted-foreground block truncate text-xs">
					{admin.email}
				</span>
			</span>
			<Button
				aria-label="로그아웃"
				onClick={signOut}
				size="icon"
				title="로그아웃"
				variant="ghost"
			>
				<LogOut aria-hidden className="h-4 w-4" />
			</Button>
		</div>
	);
}

function SidebarBody({
	admin,
	onNavigate,
}: {
	admin: AdminUser;
	onNavigate?: () => void;
}) {
	return (
		<div className="flex h-full flex-col gap-6 p-4">
			<BrandMark />
			<div className="flex-1">
				<NavList onNavigate={onNavigate} />
			</div>
			<AccountFooter admin={admin} />
		</div>
	);
}

/** 작은 화면: 상단 바 + 왼쪽에서 열리는 메뉴 */
function MobileTopbar({ admin }: { admin: AdminUser }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="bg-background/95 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
			<BrandMark />
			<Sheet onOpenChange={setOpen} open={open}>
				<SheetTrigger
					render={<Button aria-label="메뉴 열기" size="icon" variant="ghost" />}
				>
					<Menu aria-hidden className="h-5 w-5" />
				</SheetTrigger>
				<SheetContent className="w-72 p-0" side="left">
					<SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
					<SidebarBody admin={admin} onNavigate={() => setOpen(false)} />
				</SheetContent>
			</Sheet>
		</div>
	);
}

/**
 * 관리자 화면 골격. 큰 화면은 고정 사이드바, 작은 화면은 상단 바.
 * 본문은 옅은 바탕(canvas) 위에 흰 카드를 올려 계층을 만든다.
 */
export function AdminShell({
	admin,
	children,
}: {
	admin: AdminUser;
	children: ReactNode;
}) {
	return (
		<div className="bg-canvas min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
			<a
				className="bg-background sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
				href="#admin-main"
			>
				본문으로 건너뛰기
			</a>
			<aside className="bg-background sticky top-0 hidden h-svh border-r lg:block">
				<SidebarBody admin={admin} />
			</aside>
			<MobileTopbar admin={admin} />
			<main
				className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
				id="admin-main"
			>
				{children}
			</main>
		</div>
	);
}
