# packages/env AGENTS.md

이 문서는 `packages/env`(=@jwc/env) 패키지 작업 규칙과 구조를 설명합니다.

- 범위: 환경변수 스키마/검증을 단일 소스로 관리하는 패키지
- 기반: `@t3-oss/env-nextjs` + `zod/v4`
- 상위 규칙: 저장소 루트의 `AGENTS.md`를 우선 적용

---

## Problem 1-Pager (작업 전 5–10줄)

- 배경 / 문제 / 목표 / 비목표 / 제약(런타임, 보안, 배포환경)

---

## 구조

- `src/app.ts`
  - 앱 전체 env 조합(extends) + 클라이언트 공개 변수 정의
- `src/node.ts`
  - Node 공통 env(`NODE_ENV`, `AES_KEY` 등)
- `src/convex.ts`
  - Convex 연동에 필요한 env
- `src/google.ts`
  - Google API/Sheets 관련 env (`GOOGLE_PRIVATE_KEY`는 `\\n` → `\n` 변환)
- `src/sentry.ts`
  - 프로덕션에서만 강제되는 Sentry env
- `src/solapi.ts`
  - Solapi SMS 발송 관련 env
- `src/helpers/skipValidation.ts`
  - CI/린트 환경에서 검증 스킵(개발 UX 목적)

---

## 공개 API(Exports) 규칙

`package.json#exports` 기준으로만 노출합니다.

- `@jwc/env/*` → `src/*.ts`
- `@jwc/env/helpers/*` → `src/helpers/*.ts`

새 env 모듈 추가 시:
- `src/<name>.ts`로 추가
- 가능하면 `src/app.ts`의 `extends`에 포함(앱 단일 엔트리 유지)

---

## 보안 규칙(중요)

- 비밀값(키/토큰/프라이빗키)은 절대 로그로 출력하지 않습니다.
- 클라이언트로 노출되는 변수는 `NEXT_PUBLIC_*`만 허용합니다.
- `GOOGLE_PRIVATE_KEY` 같은 멀티라인 값은 반드시 변환 로직을 유지합니다.

---

## 로컬 검증

- `pnpm -C packages/env typecheck`
- `pnpm -C packages/env lint`
