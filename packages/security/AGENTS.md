# packages/security AGENTS.md

HTTP 경계 보안: 요청 판정(본문 상한, 교차 출처, 경로 정책 표), CSP/보안 헤더, 고정 창 속도 제한(저장소 포트), Turnstile 검증. 정책은 앱이 데이터로 넘긴다.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- 판정/헤더 생성은 순수 함수다. 어떤 경로를 막을지, 어떤 출처를 허용할지는 앱 정책 표가 정한다.
- 속도 제한 카운터 저장소는 포트(`BucketStore`)로 주입한다. 대상(IP)은 해시만 저장한다.
- Turnstile 검증 서버 장애는 통과로 보지 않는다 (`unavailable`).

## 확장

새 경로 규칙/제한은 앱 `platform/server/security/policy.ts` 표에 추가한다.

## 검증

- `pnpm -C packages/security typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
