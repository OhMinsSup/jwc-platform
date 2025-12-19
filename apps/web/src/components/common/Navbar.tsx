import { Button } from "@jwc/ui";
import { Github } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface NavbarProps {
	/** 우측 영역에 표시할 내용 */
	rightSlot?: ReactNode;
	/** 네비게이션 링크 영역 */
	navSlot?: ReactNode;
	/** 상태 표시 영역 (로고와 네비게이션 사이) */
	statusSlot?: ReactNode;
}

/**
 * 공통 네비게이션 바 컴포넌트
 *
 * @example
 * ```tsx
 * <Navbar
 *   navSlot={
 *     <>
 *       <Link to="/">홈</Link>
 *       <Link to="/about">소개</Link>
 *     </>
 *   }
 *   rightSlot={
 *     <Button asChild>
 *       <Link to="/onboarding">신청하기</Link>
 *     </Button>
 *   }
 * />
 * ```
 */
export function Navbar({ rightSlot, navSlot, statusSlot }: NavbarProps) {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<Logo />
				{navSlot && (
					<nav className="hidden items-center gap-6 font-medium text-muted-foreground text-sm md:flex">
						{navSlot}
					</nav>
				)}
				<div className="flex items-center gap-4">
					<Button asChild size="icon" variant="ghost">
						<a
							href="https://github.com/OhMinsSup/jwc-platform"
							rel="noreferrer"
							target="_blank"
						>
							<Github className="h-5 w-5" />
						</a>
					</Button>
					{statusSlot}
					{rightSlot}
				</div>
			</div>
		</header>
	);
}
