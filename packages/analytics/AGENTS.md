# packages/analytics AGENTS.md

브라우저 제품 분석(PostHog): 이벤트/기능 플래그 카탈로그 기반 래퍼, URL 정리, 경로+플래그 기반 세션 리플레이. posthog-js는 처음 사용할 때 동적으로 불러온다.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- 브라우저 전용. 키가 없거나 SSR이면 모든 호출이 아무 일도 하지 않는다. posthog-js를 불러오는 동안의 호출은 순서대로 최대 50개 모아 뒀다가 로드 직후 보낸다(첫 화면 이벤트 유실 방지).
- 개인정보 기본값: 자동 수집 끔, 익명 프로필 없음, 리플레이는 플래그 + 허용 경로에서만이고 모든 입력/글자를 가린다.
- 이벤트/플래그 표와 URL 정리 규칙은 앱이 데이터로 넘긴다.
- Core Web Vitals는 LCP·INP·CLS 숫자만 수집한다. 상세 이벤트·DOM attribution은 제거하며, URL 정리도 동일하게 적용한다. 문서 수명 지표를 SPA 내부 이동별 지표로 해석하지 않는다.

## 확장

새 이벤트/플래그는 앱 `platform/analytics/events.ts` 표에 추가한다.

## 검증

- `pnpm -C packages/analytics typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
