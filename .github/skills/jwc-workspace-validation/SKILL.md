---
name: jwc-workspace-validation
description: pnpm+turbo 모노레포에서 Node 버전(.nvmrc)을 맞추고 check/typecheck/test/build를 실행하며, 실패 시 패키지 단위로 범위를 좁혀 원인을 찾습니다. 타입 검증은 tsrs(미지원 플랫폼은 tsc 폴백), 포맷/린트/테스트는 Vite+(vp), 의존성 검사는 syncpack/knip입니다.
---

# JWC Workspace Validation

## 언제 사용하나요?

- 변경 후 check/typecheck/test/build가 깨졌을 때
- 특정 패키지만 빠르게 검증하고 싶을 때

## 이 레포의 구성

| 작업      | 실행 위치                          | 도구                                        |
| --------- | ---------------------------------- | ------------------------------------------- |
| 포맷/린트 | 루트 한 번 (`pnpm check`)          | Vite+ (Oxfmt + Oxlint, ultracite 프리셋)    |
| 타입 검증 | 패키지별 (`turbo run typecheck`)   | `jwc-typecheck` → tsrs, 미지원 플랫폼은 tsc |
| 테스트    | 루트 한 번 (`pnpm test`)           | Vite+ (`vp test run`, 패키지별 projects)    |
| 의존성    | 루트 (`check:deps`/`check:unused`) | syncpack / knip                             |
| 빌드      | `apps/web` (`turbo run build`)     | `vp build` + void                           |

- `typecheck`는 의존 패키지의 `typecheck`를 먼저 실행한다 (`^typecheck`).
- tsrs가 의심스러우면 같은 tsconfig를 tsc로 돌려 비교한다: `pnpm typecheck:tsc`

## 표준 워크플로우

1. Node 맞추기: `nvm use` (루트 `.nvmrc`), pnpm은 `package.json#packageManager` 기준
2. 좁게 검증 (변경한 패키지부터)
   - `pnpm -C <pkg> typecheck`
   - `pnpm -C <pkg> test`
   - `pnpm exec vp check <path>`
3. 전체 검증 (마지막): `pnpm verify` (= check + check:deps + check:unused + typecheck + test), 필요 시 `pnpm build`

## 실패 시 분기

- 타입 오류가 tsrs에서만 나면: `pnpm -C <pkg> typecheck:tsc`로 비교하고, tsrs 문제로 보이면 `tooling/typecheck`의 플랫폼 선택과 버전을 확인
- `apps/web` 타입 오류가 `void/*` 모듈에서 나면: `pnpm -C apps/web exec void prepare`로 생성 파일을 갱신
- Node 버전 관련 오류: `node -v`를 `.nvmrc`와 맞춘다

## 보안

- `.env`와 비밀값은 커밋/로그에 남기지 않는다.
- 실패 로그를 공유할 때 키/토큰/전화번호를 마스킹한다.
