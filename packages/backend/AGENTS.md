# packages/backend AGENTS.md

이 문서는 `packages/backend`(=@jwc/backend) 패키지 작업 규칙과 구조를 설명합니다.

- 범위: Convex 백엔드(스키마/함수/HTTP 라우팅/크론/워크풀) + 인증/외부 연동(SMS/스프레드시트)
- 상위 규칙: 저장소 루트의 `AGENTS.md`를 우선 적용

---

## Problem 1-Pager (작업 전 5–10줄)

- 배경 / 문제 / 목표 / 비목표 / 제약(데이터 모델, 보안, 배포/런타임)

---

## 구조

- `convex/`
  - `schema.ts`: Convex 데이터 모델(테이블/인덱스/서치 인덱스)
  - `http.ts`: HTTP 라우터 구성(인증 라우트 등록 등)
  - `convex.config.ts`: Convex 앱 구성(plugins/workpool/crons)
  - `auth.ts`: better-auth 연동
  - `sms.ts`: Node 런타임 액션(SMS 발송, 단축 URL 등)
  - `/_generated/`: Convex 코드젠 산출물(수정 금지)

---

## 공개 API / 빌드 규칙

- 패키지 빌드는 `tsdown`으로 `convex/**/*.ts`를 대상으로 합니다.
- 외부에서 직접 import 되는 경로는 `package.json`의 서브패스 매핑(예: `./convex/*`)에 의해 결정됩니다.
- `convex/_generated`는 자동 생성이므로 직접 수정하지 않습니다.

---

## 보안/개인정보 규칙(중요)

- 전화번호 등 개인정보는 암호화/해시 정책을 지키고, 평문 로그 출력 금지
- 환경변수(`AES_KEY`, Solapi 키 등)는 절대 로그로 남기지 않습니다.
- Node 런타임 전용 로직은 파일 상단에 `"use node"`를 유지합니다.

---

## 작업 패턴

- 스키마 변경 시
  - 인덱스/검색 인덱스 영향 범위를 먼저 확인
  - 필요한 경우 `convex:codegen`/`convex:dev`로 로컬 검증
- 액션/뮤테이션/쿼리 추가 시
  - args validator를 명확히 정의
  - 에러 메시지는 구체적으로, 민감 정보는 마스킹

---

## 로컬 검증

- `pnpm -C packages/backend typecheck`
- `pnpm -C packages/backend lint`
- `pnpm -C packages/backend convex:codegen`
- `pnpm -C packages/backend convex:dev`
