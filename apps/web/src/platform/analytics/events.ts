/**
 * 클라이언트 분석 이벤트 카탈로그 (데이터). 이벤트마다 보낼 수 있는 속성을 선언한다.
 * 답변 값, 이름, 전화번호는 속성으로 두지 않는다. 폼은 slug(공개 주소)로만 식별한다.
 */
import type { EventCatalog, FlagCatalog } from "@jwc/analytics/catalog";

export const CLIENT_EVENTS = {
	/** 공개 폼 첫 화면 진입 */
	form_viewed: ["formSlug"],
	/** 폼 단계 이동 (step: 페이지 순서 1부터, 확인 단계는 "review") */
	form_step_viewed: ["formSlug", "step", "stepCount"],
	form_submit_succeeded: ["formSlug", "isNew"],
	/** code는 서버 오류 카탈로그 코드 */
	form_submit_failed: ["formSlug", "code"],
	/** 신청 내역 확인 화면 */
	submission_viewed: [],
} as const satisfies EventCatalog;

/**
 * 기능 플래그 카탈로그. PostHog에서 켜고 끄며, PostHog를 쓸 수 없을 때는 default를 쓴다.
 */
export const FEATURE_FLAGS = {
	/** 공개 폼 화면의 세션 리플레이 (모든 글자/입력은 가린 채 기록). 운영자가 필요할 때만 켠다 */
	"session-replay": { default: false },
} as const satisfies FlagCatalog;

/** 이 경로 패턴에서만 세션 리플레이를 허용한다 (관리자/신청 내역 화면은 개인정보가 보여서 제외) */
const REPLAY_PATH = /^\/f\/[^/]+\/?$/u;

export function replayAllowedOn(pathname: string): boolean {
	return REPLAY_PATH.test(pathname);
}

/** 신청 내역 주소(/r/<id>)의 id는 열람 권한 역할을 하므로 분석 도구로 보내지 않는다 */
const SUBMISSION_PATH = /\/r\/[^/?#]+/gu;

export function sanitizeUrl(url: string): string {
	return url.replaceAll(SUBMISSION_PATH, "/r/:id");
}
