import { useRouterState } from "@tanstack/react-router";

/** 로더를 기다리는 이동에도 즉시 피드백을 주고 본문 레이아웃은 유지한다. */
export function NavigationProgress() {
	const loading = useRouterState({ select: (state) => state.isLoading });
	if (!loading) {
		return null;
	}
	return (
		<output
			aria-label="페이지 이동"
			className="bg-foreground pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
		>
			<span className="sr-only">페이지를 불러오는 중입니다.</span>
		</output>
	);
}
