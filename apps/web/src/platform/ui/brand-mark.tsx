/**
 * 제품 표식의 모양: 신청 "접수표". 양옆이 파인 표 한 장 + 절취선 + 체크 = 통과한 신청.
 * 무채색만 쓴다 (typie처럼 표식도 색을 쓰지 않는다). 화면에서는 아래 AppIcon으로만 그린다.
 * 경로 값은 favicon(public/favicon.svg)과 같아야 한다 (test/brand-assets.test.ts가 확인).
 */
export const TICKET_PATHS = {
	body: "M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V10a2 2 0 0 0 0 4v3.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V14a2 2 0 0 0 0-4V6.5Z",
	perforation: "M15 7.5v1.5M15 11.25v1.5M15 15v1.5",
	check: "m7 12.2 1.6 1.6L11.8 10.4",
} as const;

/** 앱 아이콘 칸(32)에 접수표(24)를 가운데 두고 1.25배로 키운다. favicon과 같은 값 */
export const APP_ICON_TICKET_TRANSFORM =
	"translate(16 16) scale(1.25) translate(-12 -12)";

/**
 * 앱 아이콘: 잉크 칸 위에 반전된 접수표. 브라우저 탭(favicon)·홈 화면 아이콘과 같은 모양이라
 * 머리/바닥·로그인 카드의 표식으로 쓴다. 다크에서는 잉크와 바탕이 서로 바뀐다.
 */
export function AppIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden
			className={className}
			fill="none"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect fill="var(--foreground)" height="32" rx="8" width="32" />
			<g transform={APP_ICON_TICKET_TRANSFORM}>
				<path d={TICKET_PATHS.body} fill="var(--background)" />
				<path
					d={TICKET_PATHS.perforation}
					stroke="var(--foreground)"
					strokeLinecap="round"
					strokeWidth="1.5"
				/>
				<path
					d={TICKET_PATHS.check}
					stroke="var(--foreground)"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="1.6"
				/>
			</g>
		</svg>
	);
}
