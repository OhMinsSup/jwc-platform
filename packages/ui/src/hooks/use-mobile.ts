import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * 화면 폭 구독. 브라우저의 matchMedia(외부 상태)를 useSyncExternalStore로 읽는다.
 * (shadcn 원본은 useEffect + useState: 첫 렌더가 늘 false였다가 한 번 더 렌더됐다)
 * 서버 렌더와 하이드레이션 첫 렌더는 데스크톱(false)으로 맞춘다.
 */
function subscribe(onChange: () => void) {
	const query = window.matchMedia(MOBILE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
	return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
	return false;
}

export function useIsMobile() {
	return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
