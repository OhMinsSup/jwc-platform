# packages/submission-store AGENTS.md

응답 저장소 포트(SubmissionStore)와 어댑터(Google Sheets = 주 DB, 메모리 = 테스트/기준 구현). 새 저장소는 ./contract의 계약 테스트를 통과시키는 어댑터 하나로 붙인다.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- 서비스는 `SubmissionStore` 포트(`.`)에만 의존한다. 한 폼의 공간에 묶어 쓸 때는 `./bound`의 `bindSubmissionStore`를 쓴다. 어댑터는 공급자 오류를 `SubmissionStoreError`(unavailable/forbidden/layout/not_found)로 바꿔 던진다.
- 유니크 판정/동시 쓰기 직렬화는 저장소 책임이 아니다 (앱의 D1 `submission_keys`가 맡는다).
- `paid`를 생략한 쓰기는 기존 값을 보존해야 한다 (운영자가 시트에서 바꾼 납입 여부).

## 확장

새 저장소 = `src/<이름>/store.ts` 어댑터 + `describeSubmissionStoreContract("<이름>", create)` 한 줄 테스트. 계약을 통과하면 앱 `platform/server/runtime.ts`에서 조립만 바꾼다.

## 검증

- `pnpm -C packages/submission-store typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
