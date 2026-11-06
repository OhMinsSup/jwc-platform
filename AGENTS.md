# AGENTS.md

문제 정의 → 작고 안전한 변경 → 변경 리뷰 → 리팩터링 — 이 루프를 반복한다.

## 필수 규칙 (Mandatory Rules)

- 무엇이든 변경하기 전에, 호출/참조 경로를 포함하여 관련 파일을 처음부터 끝까지 읽는다.
- 작업, 커밋, PR을 작게 유지한다.
- 가정을 했다면 Issue/PR/ADR에 기록한다.
- 비밀값을 커밋하거나 로그에 남기지 않는다; 모든 입력을 검증하고 출력은 인코딩/정규화한다.
- 섣부른 추상화를 피하고 의도를 드러내는 이름을 사용한다.
- 결정하기 전에 최소 두 가지 대안을 비교한다.

## 마인드셋 (Mindset)

- 시니어 엔지니어처럼 생각한다.
- 추측으로 뛰어들거나 성급히 결론내리지 않는다.
- 항상 여러 접근을 평가하고, 장점/단점/위험을 각각 한 줄로 적은 뒤 가장 단순한 해법을 선택한다.

## 코드 및 파일 참조 규칙 (Code & File Reference Rules)

- 파일은 처음부터 끝까지 철저히 읽는다(부분 읽기 금지).
- 코드를 변경하기 전에 정의, 참조, 호출 지점, 관련 테스트, 문서/설정/플래그를 찾아 읽는다.
- 파일 전체를 읽지 않았다면 코드를 변경하지 않는다.
- 심볼을 수정하기 전에 전역 검색으로 사전/사후 조건을 파악하고, 영향도를 1–3줄로 남긴다.

## 필수 코딩 규칙 (Required Coding Rules)

- 코딩 전에 Problem 1-Pager: 배경 / 문제 / 목표 / 비목표 / 제약을 작성한다.
- 제한을 준수한다: 파일 ≤ 300 LOC, 함수 ≤ 50 LOC, 매개변수 ≤ 5, 순환 복잡도 ≤ 10. 초과 시 분리/리팩터링한다.
- 명시적인 코드를 선호한다; 숨겨진 “매직” 금지.
- DRY를 따르되, 섣부른 추상화는 피한다.
- 부수효과(I/O, 네트워크, 전역 상태)는 경계층으로 격리한다.
- 구체적인 예외만 처리하고, 사용자에게 명확한 메시지를 제공한다.
- 구조화된 로깅을 사용하고 민감한 데이터를 기록하지 않는다(가능하면 요청/상관관계 ID를 전파한다).
- 시간대와 DST를 고려한다.

## 테스트 규칙 (Testing Rules)

- 새 코드에는 새 테스트를 추가한다; 버그 수정에는 회귀 테스트를 반드시 포함한다(먼저 실패하도록 작성).
- 테스트는 결정적이고 독립적이어야 하며, 외부 시스템은 가짜/계약(컨트랙트) 테스트로 대체한다.
- E2E 테스트에는 ≥1개의 성공 경로와 ≥1개의 실패 경로를 포함한다.
- 동시성/락/재시도에서 비롯될 위험(중복, 데드락 등)을 선제적으로 평가한다.

## 보안 규칙 (Security Rules)

- 코드/로그/티켓에 비밀값을 절대 남기지 않는다.
- 입력을 검증·정규화·인코딩하고, 파라미터화된 접근을 사용한다.
- 최소 권한 원칙을 적용한다.

## 개발 환경과 비밀값

- AI의 개발·검증은 `pnpm dev`와 공개 더미 설정(`config/env/development.env`)을 사용한다.
- 실제 환경 파일·복호화 키·키체인 값을 읽거나 출력하지 않는다. `dotenvx get`/`decrypt`/`keypair`, `with-env:real`, `dev:real`은 일반 자동 검증에 사용하지 않는다.
- 사용자가 실제 연동 검증이나 비밀값 이전을 명시적으로 요청한 경우에도 값은 도구 출력·로그에 남기지 않고 성공 여부만 확인한다.
- `.env.keys`와 배포 토큰을 AI 작업 공간에 제공하지 않는다. 키체인 접근 차단은 별도 사용자·컨테이너에서 강제한다. 저장소 규칙만으로 접근이 격리됐다고 보고하지 않는다.
- 설정과 복구 절차는 `docs/development-secrets.md`를 따른다.

## 클린 코드 규칙 (Clean Code Rules)

- 의도를 드러내는 이름을 사용한다.
- 각 함수는 한 가지 일만 한다.
- 부수효과는 경계층으로 격리한다.
- 가드절을 우선 사용한다.
- 상수는 항상 심볼화한다(하드코딩 금지).
- 코드를 입력 → 처리 → 반환 구조로 구성한다.
- 실패는 구체적인 오류/메시지로 보고한다.
- 테스트는 사용 예제로도 동작하게 하고, 경계/실패 사례를 포함한다.

## 안티 패턴 규칙 (Anti-Pattern Rules)

- 전체 문맥을 읽지 않고 코드를 수정하지 않는다.
- 비밀값을 노출하지 않는다.
- 실패나 경고를 무시하지 않는다.
- 근거 없는 최적화나 추상화를 도입하지 않는다.
- 광범위한 예외를 남용하지 않는다.

## 정적 검사 규칙 (Vite+ / syncpack / knip)

- 포맷/린트/테스트는 Vite+(`vp`) 하나로 한다. 설정은 루트 `vite.config.ts` 하나뿐이다(`fmt`/`lint`/`staged`, 규칙 기반은 ultracite 프리셋). 패키지별 린트/포맷 설정이나 `lint`/`format` 스크립트를 만들지 않고, 예외는 `OVERRIDES`에 경로와 이유를 함께 둔다.
- 검사는 `pnpm check`, 자동수정은 `pnpm fix`(`vp check --fix`), 테스트는 `pnpm test`(`vp test run`). 의존성 버전은 `pnpm check:deps`(syncpack), 안 쓰는 파일/export/의존성은 `pnpm check:unused`(knip). 전체 검증은 `pnpm verify`.
- 타입 검증은 `pnpm typecheck`(tsrs, 미지원 플랫폼은 tsc 폴백). 비교가 필요하면 `pnpm typecheck:tsc`. 린트의 타입 정보 규칙은 켜되 타입 검사 자체는 tsrs가 맡는다.
- 자동수정은 safe(`--fix`)만 쓴다. safe 수정도 의미를 바꿀 수 있으므로 적용 후 diff를 읽고 `pnpm typecheck`/`pnpm test`를 다시 돌린다. 의미가 바뀔 수 있는 자동수정은 피한다.
- 규칙 설정을 바꿀 때는 변경 이유와 기대 효과를 `vite.config.ts` 주석에 적고, 변경 후 `pnpm check`로 모든 파일이 설정을 준수하는지 확인한다.
- 의도된 예외는 해당 줄에 `// oxlint-disable-next-line <plugin/rule> -- <이유>`로 남긴다. 파일 단위 disable은 쓰지 않는다.
- **배럴 파일과 재노출 금지**: `export * from`, `export { x } from`, import한 것을 다시 `export`하는 것 모두 금지한다(다른 패키지에서 가져온 것 포함). 모든 심볼은 정의한 파일에서 직접 import하고, 패키지는 모듈별 subpath export(`@jwc/form-core/answers/validate`)로 공개한다. 린트 `jwc/no-reexport`(`tooling/lint-plugins/jwc.ts`)가 강제한다.
- 테스트 import는 `vite-plus/test`에서 가져온다. 두 패키지 이상이 쓰는 의존성은 `pnpm-workspace.yaml`의 catalog로만 버전을 정한다.

## Agent Skills 규칙 (Copilot)

이 레포는 Copilot Agent Skills를 `.github/skills/`에 둔다.

### 저장 위치 선택(대안 비교)

- 대안 A: `.github/skills/` (채택)
  - 장점: VS Code Copilot이 표준 경로로 탐색, 레포 내 가시성 좋음
  - 단점: `.github` 하위 문서가 늘어남
- 대안 B: `.claude/skills/`
  - 장점: 일부 툴링/레거시 관습과 호환
  - 단점: Copilot 표준 경로가 아니며 팀 합의가 필요

### 스킬 작성 규칙

- 경로: `.github/skills/<skill-dir>/SKILL.md`
- 스킬은 “재사용 가능한 작업 절차(워크플로우)”를 담고, 프로젝트 규칙은 이 `AGENTS.md`가 단일 소스가 된다.
- `SKILL.md` 상단에는 YAML frontmatter를 반드시 둔다.
  - `name`: 소문자/숫자/하이픈만, 최대 64자
  - `description`: 언제/왜 쓰는지까지 포함해 구체적으로(최대 1024자)
- 본문은 점진적 공개(Progressive disclosure)를 따른다.
  - 메타데이터 → 절차/체크리스트/명령어 → 참고 링크/추가 파일
- 본문은 500줄 이하를 권장하고, 상세 자료는 같은 디렉토리에 보조 파일로 분리한다.

### 보안/품질 규칙

- 스킬/예시는 비밀값을 포함하지 않는다(토큰/키/쿠키/개인정보 등).
- 외부에서 가져온 스킬은 적용 전에 반드시 리뷰한다(명령어/파일 삭제/네트워크 요청 여부 확인).
- 스킬은 “최소 변경”을 우선하며, 불필요한 자동 수정/대규모 포맷 변경을 지양한다.

### VS Code 활성화

- (프리뷰) VS Code Insiders에서 설정 `chat.useAgentSkills`를 켠다.
- 스킬 개요/추가 규칙은 `.github/skills/README.md`를 따른다.

### 현재 사용 중인 스킬

- `.github/skills/jwc-workspace-validation/`
- `.github/skills/jwc-lint-fixing/`
- `.github/skills/jwc-ui-shadcn-workflow/`

## 아키텍처 요약 (2026-11 재작성)

- 배포: void.cloud (Cloudflare Workers) + TanStack Start. 결정 기록은 `docs/adr/0001`, `docs/adr/0002`.
- 폼 구성 데이터(정의/버전)는 D1. 응답(답변/납입 여부)은 `SubmissionStore` 포트 뒤의 저장소(기본 Google Sheets)가 원본이고, D1에는 응답 키(유니크/멱등/락)와 발송 기록만 둔다 (`docs/adr/0006`).
- 폼 동작은 `packages/form-core`의 순수 함수가 정의(JSON)에서 파생한다. 라벨/옵션/금액을 코드 상수로 두지 않는다.
- 부수효과(D1, Sheets, SMS, 큐)는 `apps/web/src/server/` 아래에만 둔다. env는 `src/server/runtime.ts`에서만 읽는다.
- UI는 `packages/ui`(shadcn base-nova + Base UI). 결정 기록은 `docs/adr/0004`.
- 툴체인은 Vite+(포맷/린트/테스트) + tsrs(타입) + syncpack + knip. 결정 기록은 `docs/adr/0005`.
- 공용 패키지(`common`, `google`, `submission-store`, `observability`, `security`, `analytics`, `ui-patterns`)와 앱의 기능 단위 구조(`features/`, `platform/`), 의존 방향은 `docs/adr/0007`.
- 디자인 언어(토큰, 글꼴, 셸, 안내 상자 `Callout`)는 `docs/adr/0008`. 색은 상태·데이터에만 쓰고, 안내/오류 상자는 손으로 만들지 않고 `Callout`을 쓴다. 날짜/시각 입력은 `DatePicker`/`TimePicker`/`DateTimePicker`, 표시는 `DateTimeText`를 쓴다 (네이티브 date 입력·문자열 slice 금지).
- 패키지별 규칙: `apps/web/AGENTS.md`, `packages/form-core/AGENTS.md`, `packages/ui/AGENTS.md`.
