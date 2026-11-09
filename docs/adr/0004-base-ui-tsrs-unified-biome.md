# ADR-0004: UI를 Base UI로, 타입 검증을 tsrs로, 린트/포맷을 루트 하나로

- 상태: 채택 (Accepted). 린트/포맷·커밋 훅 항목은 ADR-0005로 대체
- 작성일: 2026-11-04

## 배경 / 문제

- `@jwc/ui`는 Radix 기반 shadcn(구 스타일)이었다. Radix는 더 이상 활발히 갱신되지 않고, shadcn의 기본 프리미티브가 Base UI로 바뀌었다.
- `tailwind.config.ts`(v3식 프리셋)가 Tailwind v4 CSS-first 구성과 섞여 있었다.
- 타입 검증은 tsc만 썼다.
- 린트/포맷 설정이 루트 + 패키지별 스크립트로 흩어져 있었고, 사용하지 않는 설정(oxlint, syncpack)이 남아 있었다. Biome 2.3에 고정되어 최신 ultracite 프리셋을 쓸 수 없었다.

## 결정

| 주제           | 결정                                                                                                                            | 비교한 대안                                      | 이유                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| UI 프리미티브  | shadcn **base-nova** + `@base-ui/react` 1.9, React 19.3, Tailwind 4.3                                                           | Radix 유지 / `shadcn add --all`로 새로 받기      | 갱신이 계속되는 쪽으로 이동. 이미 검증된 컴포넌트 세트를 그대로 가져와 버전/스타일 편차를 줄인다          |
| UI 패키지 구조 | `src/components/<name>.tsx`, `src/hooks`, `src/lib`, `src/styles/globals.css`, subpath exports만 (배럴 없음)                    | 기존 `components/shadcn/*` + `src/index.ts` 배럴 | shadcn CLI 기본 구조와 같아 `ui-add`가 그대로 동작. 배럴이 없으면 필요한 것만 번들된다                    |
| 아이콘         | `lucide-react`만                                                                                                                | 별도 아이콘 세트 추가                            | 기존 UI 규칙 유지                                                                                         |
| 폰트           | Pretendard (문서 head의 CDN)                                                                                                    | npm 폰트 패키지                                  | 한글 가독성, 기존 동작 유지                                                                               |
| 타입 검증      | `tooling/typecheck`(`jwc-typecheck`): darwin-arm64·linux-x64/arm64는 **tsrs**, 그 외는 tsc                                      | tsrs 직접 호출 / tsc만                           | 미지원 플랫폼과 CI에서도 같은 명령으로 동작. `typecheck:tsc`로 언제든 비교 가능                           |
| tsrs 버전      | `0.20.1-ts7.1.0-beta` 고정 (TypeScript 7.0과 같은 세대)                                                                         | 최신 0.21                                        | 검증된 버전으로 시작. 올릴 때 `tooling/typecheck` 테스트로 확인                                           |
| 린트/포맷      | 루트 `biome.json` 하나 (Biome 2.6 + ultracite 8, 프리셋 core/react/tanstack/vitest/drizzle). 패키지별 lint/format 스크립트 제거 | 패키지별 설정 + turbo로 실행                     | 한 번에 전체를 검사하고 규칙이 한 곳에서 보인다. TanStack 프리셋은 타입 추론이 깨지는 옵션 키 정렬을 끈다 |
| 커밋 훅        | lint-staged가 스테이징 파일에 `ultracite fix`(safe)                                                                             | 검사만                                           | AGENTS.md의 safe fix 원칙과 같음                                                                          |

## 규칙 조정과 이유

- `noExcessiveCognitiveComplexity` 상한 15: Biome 기본값이자 권장값. AGENTS.md의 "순환 복잡도 ≤ 10"은 Biome이 직접 측정하지 못하므로 함수 50줄 제한과 함께 리뷰에서 본다.
- `apps/web/src/**/*.tsx`에서 `noJsxPropsBind`, `noLeakedRender` 끔: 모든 인라인 핸들러를 `useCallback`으로 감싸는 것은 측정 근거 없는 최적화다. 리렌더 경계(memo 카드 등)는 이미 안정 콜백을 쓴다.
- `packages/ui/src/**`: shadcn 생성 코드 특성상 일부 a11y/스타일 규칙을 끈다 (생성기 출력을 손으로 고치지 않기 위해).
- `apps/web/src/routes/**` 파일 이름 규칙 끔: `$.ts`, `$slug` 같은 라우터 파일 규칙.
- `apps/web/scripts/apps-script/**` 린트 끔(포맷은 유지): Google Apps Script 런타임은 전역 범위 규칙이 달라 `var`/전역 함수가 의도된 것이다.
- 순서가 필요한 비동기 반복(큐 소비자, 문자 발송, 미입금 보정)은 해당 줄에 이유를 적고 `noAwaitInLoops`를 무시한다. 독립 조회(`openFormSummaries`)는 `Promise.all`로 바꿨다.
- 메서드 시그니처는 프로퍼티 형식으로 통일(`useConsistentMethodSignatures`): strictFunctionTypes 검사가 더 엄격해진다. 타입 검사로 확인했다.
- `DomainError`는 표준 Error처럼 `(message, { status, cause })`를 받는다. 원인 오류를 잃지 않게 하기 위함(`useErrorCause`).
- 파일 이름은 kebab-case (UI 패키지와 같은 규칙).

## Base UI 전환에서 주의할 점

타입으로 잡히지 않는 동작 차이가 있어 사용처를 직접 고쳤다. 목록은 `packages/ui/AGENTS.md`의 표에 둔다
(`render` prop, Select `items`와 `null`, 메뉴 `onClick`, ToggleGroup 배열 값, `data-active`/`data-pressed`/`data-checked`, AlertDialogAction 자동 닫힘 없음).

## 남은 일 (가정)

- 사용하지 않는 `.oxlintrc.json`, `syncpack.config.cjs`, `tooling/tailwind`는 ADR-0005 작업에서 삭제했다.
- 화면은 브라우저에서 직접 확인하지 못했다. base-nova의 기본 크기(버튼/입력 h-8)가 이전(h-10)보다 작아 시각 확인이 필요하다.
