# ADR-0007: 공용 패키지 분리, 기능 단위 앱 구조, 의존 방향

- 상태: 채택 (Accepted)
- 작성일: 2026-11-04

## Problem 1-Pager

- **배경**: ADR-0006으로 저장소 어댑터, 관측성, 보안이 들어오면서 `apps/web/src/server/`에 범용 코드(인코딩/암호, Google 클라이언트, 저장소 어댑터, 로거, 보안 판정)와 앱 고유 코드(폼/응답/관리자 접근)가 섞였다. UI도 `@jwc/ui`를 조합한 범용 패턴과 화면 전용 컴포넌트가 같은 폴더에 있었다.
- **문제**: 계층별 폴더(`services/`, `repositories/`, `components/`)라 기능 하나를 고치려면 여러 폴더를 오간다. 범용 코드는 앱 밖에서 따로 테스트/교체할 수 없다. 의존 방향이 규칙으로만 있고 강제되지 않는다.
- **목표**: (1) 범용 코드를 경계가 분명한 패키지로 분리, (2) 앱을 기능 단위 폴더로 재구성, (3) 의존 방향을 린트로 강제, (4) 반복되는 처리를 데이터(표) + 작은 해석기로 바꾼다.
- **비목표**: 동작 변경, 새 기능. 저장소 어댑터 추가(구조만 준비).
- **제약**: 파일/함수 크기 제한, 테스트는 코드와 함께 옮긴다. TanStack Router 파일 라우트는 `src/routes/`에 고정.

## 결정: 패키지

| 패키지                  | 내용                                                                                                                                                                               | 분리 이유                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@jwc/common`           | 인코딩, Web Crypto(HKDF/AES-GCM/HMAC), 상수 레코드 키, FormData 읽기, 테스트 지원(`./testing`)                                                                                     | 의존성 없는 순수 유틸. 다른 패키지들의 바닥          |
| `@jwc/google`           | 서비스 계정 토큰, Sheets REST(재시도 정책), 가짜 Sheets(`./testing`)                                                                                                               | 외부 API 클라이언트 + 계약 테스트                    |
| `@jwc/submission-store` | 저장소 포트, 메모리/Google Sheets 어댑터, **계약 테스트(`./contract`)**                                                                                                            | DB 교체 = 어댑터 하나 + 계약 테스트 한 줄            |
| `@jwc/observability`    | 요청 범위, 카탈로그 기반 로거 팩토리, PostHog 서버 전송, 워커 감싸기                                                                                                               | 이벤트 표를 데이터로 받는 범용 관측                  |
| `@jwc/security`         | 요청 판정(정책 표), CSP 빌더/보안 헤더, 속도 제한 엔진(저장소 포트), Turnstile 검증                                                                                                | 정책 표를 데이터로 받는 순수 판정                    |
| `@jwc/analytics`        | 브라우저 PostHog 팩토리, 카탈로그 속성 걸러내기, URL 정리                                                                                                                          | 클라이언트 전용, 동적 로드                           |
| `@jwc/ui-patterns`      | `@jwc/ui` 위의 재사용 패턴(페이지 머리, 요약 수치, 빈 상태, 상태 배지, 세그먼트, 복사, 검색, 가운데 안내, 폼 행/입력/섹션, 선택 컨트롤, 확인 대화상자, 라이브 영역) + 의미 색 토큰 | `@jwc/ui`는 shadcn 생성물 그대로 두고, 조합은 여기서 |

대안 비교:

- **A) 패키지 하나(`@jwc/server-kit`)에 모두**: 단순하지만 클라이언트/서버 코드가 섞이고 경계별 테스트가 흐려진다.
- **B) 위 7개 (채택)**: 패키지 수는 늘지만 각자 테스트/교체 경계가 분명하다(외부 API, 저장소, 보안 정책, 관측, UI). 작은 패키지를 더 합치는 것은 언제든 가능하다.
- **C) 앱에 그대로**: 변경이 없지만 재사용/독립 테스트 불가.

앱에 남긴 것: 폼/응답/관리자 접근 도메인(판단 함수, 서비스, D1 저장소), 폼 편집기/렌더러, 라우트와 서버 함수, Solapi 클라이언트(한 곳에서만 씀), 앱 정책/카탈로그 표.

## 결정: 앱 구조

```
src/features/<기능>/{domain, model, server, ui, functions}   기능 하나 = 폴더 하나
src/platform/{server, analytics, ui, functions}              공통 기반 (env, 로그, 오류, 관측, 보안, 셸)
src/routes/                                                  파일 라우트 (고정)
```

기능: `forms`, `submissions`, `admin-access`, `form-builder`, `form-engine`.

## 결정: 의존 방향 (린트로 강제)

`routes → features → platform → packages`, 그리고 `features/*/domain|model`은 I/O·UI·바깥 계층을 import하지 않는다.
`vite.config.ts`의 `LAYER_RULES`가 `no-restricted-imports`로 막는다 (packages → apps, platform → features, domain/model → void·react·서버 모듈).

## 결정: 배럴 파일·재노출 금지

- `export * from`, `export { x } from`, import한 이름을 다시 `export { x }` / `export default x` 하는 것을 모두 금지한다 (다른 패키지에서 가져온 것 포함).
- 모든 심볼은 정의한 파일에서 직접 import한다. 패키지는 모듈별 subpath export로 공개한다 (`@jwc/form-core`는 `"./*": "./src/*.ts"` → `@jwc/form-core/answers/validate`).
- 이유: 의존 그래프가 실제 정의 위치를 그대로 보여 주고, 배럴을 통한 불필요한 모듈 적재/순환 import를 없앤다.
- 강제: 레포 전용 Oxlint JS 플러그인 `tooling/lint-plugins/jwc.ts`의 `jwc/no-reexport` (error). `oxc/no-barrel-file`(임계값 방식)은 이 규칙으로 대신한다.
- 예외 처리: D1 스키마는 묶음 파일 대신 `db/schema.ts` 한 파일에 모든 표를 정의한다(void가 이 파일을 `@schema`로 읽는다). `@jwc/ui`의 shadcn `direction.tsx`(Base UI 재노출뿐)는 쓰지 않아 삭제했다 — `ui-add`로 다시 받으면 린트가 막는다.

## 데이터 지향 설계를 어떻게 더 썼는가

1. **판단은 데이터를 돌려주는 순수 함수, 실행은 해석기**: `admitSubmission`/`planSubmissionWrite`/`planReminders`/`decideSignupPath`(domain) → 서비스가 결과대로 D1/저장소/큐를 실행.
2. **분기 대신 표**: 오류 카탈로그(코드 → 상태/문장/재시도/로그 레벨/보고), 서버·클라이언트 이벤트 카탈로그(이벤트 → 허용 필드), 속도 제한 규칙, 요청 정책(경로 → 거절/제한), CSP 지시어, 기능 플래그, 큐/크론 분배 표, 관리자 메뉴, 감사 작업 라벨.
3. **패키지는 표를 받는 엔진**: 로거/분석/보안 패키지는 앱의 표를 인자로 받는다. 새 이벤트·규칙은 앱 표에 한 줄 추가로 끝난다.
4. **반복 처리를 선언으로**: 관리자 작업 감사 기록은 `audited(admin, result => entry, run)` — 서버 함수는 "무엇을 남길지"만 데이터로 선언한다.
5. **상태는 저장하지 않고 파생**: 미입금 알림 횟수는 발송 사실에서, 동기화 상태는 없앰(저장소가 원본).

## 결과

- 테스트는 코드와 함께 옮겼다(패키지별 `test/`). 앱/패키지 합계 테스트 수는 그대로이고, 범용 테스트는 앱 표 대신 테스트용 표로 다시 썼다.
- 동작 변경 없음. `markPaid`는 응답 기능(`features/submissions/server/mark-paid.ts`)으로 옮겼다(폼 서비스에 있던 것).
- Tailwind는 `@jwc/ui-patterns/styles.css`의 `@source`로 패턴 컴포넌트를 스캔한다(빌드 CSS에서 클래스 생성 확인).
