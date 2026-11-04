# packages/google AGENTS.md

Google API 최소 클라이언트: 서비스 계정 JWT/토큰 공급자, Sheets v4 REST(요청별 재시도 정책). fetch 주입으로 계약 테스트 가능. 테스트용 가짜 Sheets는 ./testing.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- Google API 응답은 zod로 검증한다. 형식이 다르면 재시도 가능한 오류로 던진다.
- 재시도 정책: 같은 결과를 내는 요청(읽기/덮어쓰기)은 429·5xx, 중복이 생기는 요청(행 추가/탭 생성)은 429만.
- fetch와 재시도 정책은 주입 가능하게 둔다 (계약 테스트). 비밀값(개인 키, 토큰)을 오류 문장/로그에 넣지 않는다.

## 확장

새 API는 같은 `request(path, schema, init)` 헬퍼로 추가하고 `test/`에 기록된 fetch로 계약 테스트를 쓴다.

## 검증

- `pnpm -C packages/google typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
