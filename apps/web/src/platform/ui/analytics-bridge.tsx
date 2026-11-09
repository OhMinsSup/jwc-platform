import type { AnalyticsConfig } from "@jwc/analytics";
import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { initAnalytics, syncReplay } from "../analytics/client";

/** 분석 초기화 + 경로가 바뀔 때 세션 리플레이 허용 여부를 맞춘다 (화면에는 아무것도 그리지 않는다) */
export function AnalyticsBridge({
	config,
}: {
	config: AnalyticsConfig | null;
}) {
	const pathname = useLocation({ select: (location) => location.pathname });
	useEffect(() => {
		initAnalytics(config);
	}, [config]);
	useEffect(() => {
		syncReplay(pathname);
	}, [pathname]);
	return null;
}
