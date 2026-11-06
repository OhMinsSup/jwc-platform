/**
 * 제품 표식: 신청 "접수표". 양옆이 파인 표 한 장 = 이 도구가 하는 일(행사 신청을 받아 확인해 주는 것).
 * 무채색 잉크 한 덩어리 (typie처럼 표식도 색을 쓰지 않는다). 다크에서는 글자색을 따라 반전된다.
 */
export function TicketMark({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V10a2 2 0 0 0 0 4v3.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V14a2 2 0 0 0 0-4V6.5Z"
				fill="currentColor"
			/>
			<path
				d="M15 7.5v1.5M15 11.25v1.5M15 15v1.5"
				stroke="var(--background)"
				strokeLinecap="round"
				strokeWidth="1.5"
			/>
			<path
				d="m7 12.2 1.6 1.6L11.8 10.4"
				stroke="var(--background)"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.6"
			/>
		</svg>
	);
}
