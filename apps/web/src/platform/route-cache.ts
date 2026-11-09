/**
 * 관리자 화면 loader 데이터를 다시 들어올 때 재사용하는 시간 (기본값 0이면 들어올 때마다 Worker 요청).
 * 내가 바꾼 데이터는 변경 직후 router.invalidate로 바로 다시 읽으므로, 이 시간만큼 늦게 보이는 것은
 * 다른 관리자나 신청자가 바꾼 내용뿐이다. 편집기는 상태를 첫 렌더에만 읽어 적용하지 않는다.
 */
export const ADMIN_LOADER_STALE_TIME_MS = 30_000;
