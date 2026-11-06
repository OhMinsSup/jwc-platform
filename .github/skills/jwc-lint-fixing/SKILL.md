---
name: jwc-lint-fixing
description: Vite+(vp check = Oxfmt + Oxlint, ultracite 프리셋) 포맷/린트 오류와 syncpack/knip 경고를 의미 변경 없이 해결할 때. 설정은 루트 vite.config.ts / syncpack.config.ts / knip.config.ts 하나씩이며 패키지별 lint/format 설정은 없습니다.
---

# Lint / Format Fixing (Vite+)

## 구성 (한 곳에서만)

| 대상                       | 설정                                              | 비고                                                             |
| -------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| 포맷 + 린트 + 커밋 훅      | 루트 `vite.config.ts` (`fmt` / `lint` / `staged`) | 린트 규칙 기반은 `ultracite/oxlint/{core,react,tanstack,vitest}` |
| 의존성 버전 일관성         | 루트 `syncpack.config.ts`                         | catalog 사용, 툴체인 정확한 버전                                 |
| 안 쓰는 파일/export/의존성 | 루트 `knip.config.ts`                             | entry가 정적 import 밖에 있을 때만 설정에 적는다                 |

- 패키지별 린트/포맷 설정이나 `lint`/`format` 스크립트를 만들지 않는다. 예외는 `vite.config.ts`의 `OVERRIDES`에 경로와 이유를 함께 둔다.
- override에서 플러그인 규칙(`vitest/*`, `react/*` 등)을 끄려면 그 override에 `plugins`도 적어야 적용된다.
- 커밋 시 `.vite-hooks/pre-commit`이 `vp staged`(스테이징 파일에 `vp check --fix`)를 실행한다. 훅은 `pnpm install`의 `prepare`(`vp config`)가 설치한다.

## 명령

| 목적                       | 명령                                                     |
| -------------------------- | -------------------------------------------------------- |
| 포맷 + 린트 검사 (CI 기준) | `pnpm check`                                             |
| safe fix 적용              | `pnpm fix`                                               |
| 린트만 / 포맷만            | `pnpm lint` / `pnpm format`                              |
| 특정 경로만                | `pnpm exec vp check --fix <path>`                        |
| 의존성 버전                | `pnpm check:deps` (자동 수정 `pnpm fix:deps`)            |
| 안 쓰는 코드               | `pnpm check:unused`                                      |
| 전체 검증                  | `pnpm verify` (check → deps → unused → typecheck → test) |

## 원칙

- `--fix`(safe)만 쓴다. `oxlint --fix-suggestions` / `--fix-dangerously`는 쓰지 않는다.
- 자동 수정 후 반드시 `pnpm typecheck`와 `pnpm test`를 다시 돌리고 diff를 읽는다. safe로 분류된 수정도 의미를 바꾼 적이 있다:
  - `getElementById(id)` → `querySelector("#" + id)` (선택자 이스케이프 필요, 타입 변경) — 규칙을 꺼 두었다
  - Promise 반환 함수에 `async` 일괄 추가 (동기 throw가 reject로 바뀜) — 규칙을 꺼 두었다
  - `x !== false` → `x` (값이 undefined면 결과가 뒤집힘) — 의도된 비교는 줄 단위로 무시
- 규칙을 끄기 전에 코드를 고칠 수 있는지 먼저 본다. 의도된 예외는 해당 줄에 `// oxlint-disable-next-line <plugin/rule> -- <이유>`로 남긴다. 파일 단위 disable은 쓰지 않는다.
- 규칙 설정을 바꾸면 이유와 기대 효과를 `vite.config.ts` 주석에 적고, 전체 `pnpm check`로 확인한다.

## 자주 나오는 케이스

- `no-unsafe-type-assertion`: 외부 응답/복호화 값은 zod로 검증한다. 코드 상수 레코드의 키는 `apps/web/src/lib/object.ts`의 `keysOf`. Select 값은 알려진 집합으로 좁히는 타입 가드.
- `require-unicode-regexp`: `u` 플래그를 붙이기 전에 유니코드 모드에서 같은 의미인지 확인한다 (불필요한 이스케이프는 문법 오류가 된다).
- `vitest/prefer-strict-equal`: `toStrictEqual`로 바꾸고, 실패하면 기대값을 고친다 (제품 코드를 테스트에 맞추지 않는다).
- `no-await-in-loop`: 순서가 필요한 처리(큐 소비자, 문자 발송, 미입금 보정)는 이유를 적어 무시, 독립 조회는 `Promise.all`.
- `complexity`(≤10) / `max-lines-per-function`(≤50): 이름 있는 순수 함수/컴포넌트로 분리한다.

## 버전 올릴 때

- `vite-plus`를 올리면 catalog의 `oxlint`/`oxfmt`/`vitest`와 `overrides.vite`(`@voidzero-dev/vite-plus-core`)를 같은 세대로 맞춘다 (`pnpm exec vp --version`으로 번들 버전 확인).
- `ultracite` 프리셋은 특정 oxlint 버전 규칙을 참조한다. 번들 oxlint보다 새 프리셋이면 "Rule ... not found"로 설정 로딩이 실패하므로, 프리셋의 oxlint 요구 버전을 확인하고 고정한다.

## 참고

- 레포 공통 규칙: [AGENTS.md](../../../AGENTS.md)
- 결정 기록: [ADR-0005](../../../docs/adr/0005-vite-plus-toolchain.md)
