# packages/common AGENTS.md

앱/패키지 공용 순수 유틸: 인코딩(base64/hex, 상수 시간 비교, 무작위 id), Web Crypto(HKDF 용도별 키, AES-GCM, HMAC), 상수 레코드 키, FormData 텍스트 읽기. 런타임 의존성 없음.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- 런타임 의존성 없음. Workers/브라우저/Node 어디서나 동작하는 Web 표준 API만 쓴다.
- 도메인 개념(폼, 응답)을 넣지 않는다. 두 곳 이상에서 쓰는 범용 함수만 둔다.
- `./testing`은 테스트 지원(가짜 fetch, 실패 단언) 전용. 운영 코드에서 import하지 않는다.

## 확장

새 유틸은 subpath export(`./<이름>`)로 추가하고 테스트를 함께 둔다.

## 검증

- `pnpm -C packages/common typecheck`
- `pnpm test` (루트, 이 패키지는 `vite.config.ts`의 test.projects에 포함)
