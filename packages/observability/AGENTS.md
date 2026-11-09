# packages/observability AGENTS.md

관측성: 요청 범위(requestId), 이벤트 카탈로그 기반 허용 목록 로거, 오류 추적/제품 이벤트 PostHog 서버 전송(HTTP batch), 워커 진입점 감싸기. 이벤트 표는 앱이 데이터로 넘긴다.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- 이벤트 표(카탈로그)는 앱이 데이터로 넘긴다. 로거는 선언된 필드만 내보내고 전화번호 형태 문자열을 가린다.
- 관측이 서비스를 막지 않는다: PostHog 전송은 범위가 끝난 뒤 `waitUntil`, 실패는 결과 값으로만 돌려준다.
- 사용자 문장이 아니라 오류 코드/내부 문장(정리됨)만 오류 추적에 보낸다.

## 확장

새 이벤트는 앱의 `platform/server/telemetry/events.ts`에 필드와 함께 한 줄 추가한다(이 패키지는 바꾸지 않는다).

## 검증

- `pnpm -C packages/observability typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
