# ADR-0005: 포맷/린트/테스트를 Vite+로, 의존성 검사에 syncpack/knip

- 상태: 채택 (Accepted)
- 작성일: 2026-11-04
- 대체: ADR-0004의 "린트/포맷", "커밋 훅" 항목

## 배경 / 문제

- 린트/포맷은 Biome(ultracite 프리셋), 테스트는 패키지별 vitest, 커밋 훅은 husky + lint-staged로 도구가 셋으로 나뉘어 있었다.
- 앱 빌드는 이미 Vite 8이다. 같은 툴체인(Vite+: Vite, Vitest, Oxlint, Oxfmt)으로 묶으면 버전 관리 지점이 줄어든다.
- 의존성 버전 일관성(같은 패키지의 범위가 패키지마다 다름)과 안 쓰는 파일/export를 기계적으로 잡는 장치가 없었다. 기존 `syncpack.config.cjs`는 이 레포에 없는 패키지(next, payload)를 가리키고 있었다.

## 결정

| 주제           | 결정                                                                                                                                       | 비교한 대안             | 이유                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 포맷/린트      | `vp check` (Oxfmt + Oxlint), 설정은 루트 `vite.config.ts` 하나                                                                             | Biome 유지              | 빌드/테스트와 같은 툴체인. ultracite가 oxlint 프리셋을 제공해 규칙 기반을 그대로 이어 간다                                                             |
| 규칙 기반      | `ultracite/oxlint/{core,react,tanstack,vitest}`를 합치고 AGENTS.md 수치 제한(복잡도 10, 함수 50줄, 파일 300줄, 매개변수 5)을 규칙으로 강제 | 프리셋만                | Biome은 순환 복잡도를 직접 재지 못했다. 이제 리뷰가 아니라 린트가 막는다                                                                               |
| 타입 정보 린트 | `typeAware: true`, `typeCheck: false`                                                                                                      | 타입 검사까지 vp에      | 타입 검사는 tsrs(ADR-0004)가 맡는다. 같은 검사를 두 번 하지 않는다                                                                                     |
| 테스트         | `vp test run` (루트 `test.projects`), import는 `vite-plus/test`                                                                            | 패키지별 vitest + turbo | 한 번에 전체를 돌리고, vitest 사본이 Vite+ 번들과 어긋나지 않는다                                                                                      |
| Vite 사본      | `overrides.vite = npm:@voidzero-dev/vite-plus-core`, `overrides.vitest = catalog:`                                                         | 앱은 upstream vite 유지 | Vite 사본이 둘이면 플러그인/TanStack Start의 instanceof 검사가 깨질 수 있다. 별칭 버전(1.x)으로 인한 peer 경고는 `peerDependencyRules.allowAny`로 처리 |
| 커밋 훅        | `.vite-hooks/pre-commit` → `vp staged` (스테이징 파일에 `vp check --fix`)                                                                  | husky + lint-staged     | 도구 하나 줄어듦. `prepare`의 `vp config`가 훅을 설치한다                                                                                              |
| 의존성 버전    | syncpack 15 (`syncpack.config.ts`): 같은 의존성은 같은 버전, catalog에 있으면 catalog로, 툴체인은 정확한 버전                              | sherif만                | catalog 우회(`DiffersToCatalog`)와 범위 어긋남을 CI에서 잡는다                                                                                         |
| 안 쓰는 코드   | knip 6 (`knip.config.ts`), `pnpm check:unused`                                                                                             | 수동 정리               | 이번에 안 쓰는 export 30여 개, devDependency 3개, 생성기 1개를 찾았다                                                                                  |
| pnpm           | 9.7 → 10.34                                                                                                                                | 9.7 유지                | 9.7은 `pnpm-workspace.yaml`의 overrides를 읽지 않고, 이 구성에서 해석 단계가 끝나지 않았다                                                             |

## 규칙 조정과 이유 (요약, 전체는 `vite.config.ts` 주석)

- 끈 규칙: `func-style`, `react/function-component-definition`(함수 선언 코드베이스), `react-perf/jsx-no-new-function-as-prop`, `prefer-arrow-callback`(memo 함수 이름 = DevTools 이름), `typescript/promise-function-async`(자동 수정이 동기 throw를 reject로 바꿈), `unicorn/prefer-query-selector`(자동 수정이 `getElementById`를 이스케이프 없는 선택자로 바꿈), `typescript/strict-void-return`(no-misused-promises와 중복).
- 옵션 조정: `strict-boolean-expressions`는 nullable string/boolean만 허용(숫자·객체·유니온은 검사), `no-confusing-void-expression`은 화살표 축약 허용, `no-use-before-define`은 함수 선언 제외, `no-misused-promises`는 JSX 속성만 제외.
- 테스트: `prefer-to-be-truthy|falsy` 끔 (`toBe(true)`보다 약한 단언). `prefer-strict-equal`은 켜고 기존 테스트를 `toStrictEqual`로 바꿨다.
- 경로별: `packages/ui/src/**`(shadcn 생성 코드), `apps/web/src/routes/**`(`throw redirect()/notFound()`), Apps Script.
- 버전 고정: ultracite는 8.1.0 (8.1.1은 번들 oxlint 1.89에 없는 규칙을 참조해 설정 로딩이 실패한다).

## 이번 정리에서 지운 것

- `biome.json`, `.oxlintrc.json`(미사용), `syncpack.config.cjs`(다른 프로젝트 내용), `tooling/tailwind`(Tailwind v3 프리셋, 미사용), `.husky/`, `turbo/generators`(없는 catalog 항목과 설치되지 않은 prettier를 참조해 동작하지 않던 패키지 생성기)와 `@turbo/gen`, `tooling/scripts`(AI PR 텍스트 생성 스크립트, 요청에 따라 제거).
- 미사용 catalog 항목(`postcss`, 기본 catalog의 `tailwindcss`, `@tailwindcss/postcss`), `apps/web`의 미사용 devDependency(`@jwc/tsconfig`, `tailwindcss`).
- 어디서도 쓰지 않던 `fieldTypeLabel`, `FORM_STATUS_LABEL`. 파일 안에서만 쓰는 심볼은 export를 뗐다.

## 결과로 바뀐 동작 (가정 포함)

린트 정리 중 외부 경계에 검증을 넣어 "형식이 잘못된 응답"의 처리만 달라졌다. 정상 경로는 같다.

- Google 토큰/Sheets 응답, 복호화한 큐 페이로드를 zod로 검증한다. 형식이 틀리면 전에는 `undefined`가 흘러갔고, 지금은 구체적인 오류(재시도 대상)를 던진다.
- Solapi 2xx 응답의 형식이 틀리면 발송된 것으로 본다(`messageId: ""`). 전에는 TypeError로 큐가 재시도해 문자가 중복 발송될 수 있었다. (가정: 2xx면 업체가 접수한 것)
- 도메인 오류 클래스가 `name`을 클래스 이름으로 갖는다(전에는 `"Error"`). `.name`을 읽는 곳은 없다.
- `errors.ts`는 클래스별 파일(`server/errors/*`)로 나뉘었고 import 경로(`../errors`)는 그대로다.

## 남은 일

- `.agents/`, `.claude/`(로컬 에이전트 스킬, 추적하지 않음)는 검사 대상에서 뺐다. 레포에 넣을지는 별도로 정한다.
- Vite+ 에디터 확장(`VoidZero.vite-plus-extension-pack`)으로 바꿨다. 각자 Biome 확장을 끄거나 지워야 저장 시 포맷이 겹치지 않는다.
