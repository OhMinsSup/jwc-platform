# apps/web AGENTS.md

TanStack Start + void(Cloudflare Workers). 공개 신청 화면, 관리자 콘솔, 큐/크론 소비자.

## 구조 (ADR-0007)

기능 단위 폴더(`features/`)와 공통 기반(`platform/`)으로 나눈다. 새 기능은 `features/<이름>/` 폴더 하나로 추가한다.

| 경로                                | 역할                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/<기능>/domain/`       | 순수 판단 함수 (I/O·UI 금지, 린트로 강제). 데이터만 받고 돌려준다                                                                                                                                                        |
| `src/features/<기능>/model/`        | 순수 표/변환 (라벨, 상태 메타, 필터)                                                                                                                                                                                     |
| `src/features/<기능>/server/`       | 해석기(서비스) + D1 저장소(`*-repository.ts`). domain의 결과를 실행만 한다                                                                                                                                               |
| `src/features/<기능>/functions*.ts` | 서버 함수 경계. zod 검증 → `toResult` → 서비스. 바꾸는 관리자 작업은 `audited(...)`로 감사 기록                                                                                                                          |
| `src/features/<기능>/ui/`           | 기능 전용 컴포넌트 (재사용 가능한 것은 `@jwc/ui-patterns`로)                                                                                                                                                             |
| `features/forms`                    | 폼 생성/초안/발행/상태, 정의 로드, 폼 목록 UI                                                                                                                                                                            |
| `features/submissions`              | 제출 계획(domain), 제출·알림·신청 내역·관리자 목록·납입 변경(server), 응답 표(ui)                                                                                                                                        |
| `features/admin-access`             | Better Auth 설정·세션·`adminOnly`, 초대/가입(domain+server), 감사 기록, 관리자 화면 UI                                                                                                                                   |
| `features/form-builder`             | 관리자 폼 편집기 (ADR-0003). `model/` = 순수 리듀서/참조 연쇄/파생 인덱스                                                                                                                                                |
| `features/form-engine`              | 정의 기반 공개 폼 렌더러. 필드 타입 → 컴포넌트 표                                                                                                                                                                        |
| `src/platform/server/`              | 공통 기반: `runtime.ts`(env를 읽는 유일한 곳, 어댑터 조립), `log.ts`, `errors/`(오류 카탈로그), `telemetry/`(서버 이벤트 카탈로그), `security/`(정책 표), `server-fn.ts`(`toResult`), `validation.ts`, 큐 설정/워커 분배 |
| `src/platform/analytics/`           | 클라이언트 이벤트/기능 플래그 카탈로그 + `@jwc/analytics` 바인딩                                                                                                                                                         |
| `src/platform/ui/`                  | 셸(관리자/공개), 인증 카드, 라우트 상태 화면                                                                                                                                                                             |
| `src/routes/`                       | 파일 라우트 (TanStack 규칙상 여기 고정). 로더는 기능의 서버 함수를 부른다                                                                                                                                                |
| `db/schema/*`                       | D1 Drizzle 스키마. 변경 후 `pnpm db:generate` → 마이그레이션 검토(순서/데이터 복사)                                                                                                                                      |
| `queues/`, `crons/`                 | 소비자/작업. 운영 연결은 `server.ts` + `void.config.ts` (ADR-0002)                                                                                                                                                       |

의존 방향 (린트 `no-restricted-imports`로 강제): `routes → features → platform → packages`. platform은 features를, domain/model은 I/O·UI·바깥 계층을, packages는 앱을 import하지 않는다.

## 규칙

- `useEffect`는 외부 시스템 동기화와 구독·해제에만 사용하고, 남기는 이유를 코드에서 설명한다. 파생 값은 렌더에서 계산하고, 사용자 동작은 이벤트 핸들러에서 처리하며, DOM 연결 시점 작업은 callback ref를 우선한다. Effect를 없애려고 렌더 중 I/O·ref 변경을 하거나 다른 훅으로 숨기지 않는다. 편집기의 상태와 이벤트 명령은 인스턴스별 store 하나를 읽는다 (ADR-0014).
- 답변/납입 여부의 원본은 응답 저장소다. D1에는 답변·연락처·납입 여부를 저장하지 않는다(키/멱등/락만). 큐 payload는 항상 `encryptJson`으로 암호화한다.
- 서비스는 `SubmissionStore` 포트에만 의존한다. 공급자(Google) 오류 타입은 어댑터 밖으로 내보내지 않는다(`SubmissionStoreError`로 변환).
- 로그/분석 이벤트는 카탈로그(서버 `platform/server/telemetry/events.ts`, 클라이언트 `platform/analytics/events.ts`)에 필드를 먼저 선언한다. 답변·이름·전화번호·문자 본문·토큰은 필드로 두지 않는다.
- 실패는 오류 카탈로그 코드로 분류한다. 사용자에게는 `DomainError`의 문장만 보이고, 그 밖의 오류 문장은 내부 로그로만 남긴다.
- `queues/*.ts`의 옵션 export와 `crons/*.ts`의 `cron`은 void가 정적으로 읽으므로 리터럴만 쓴다.
- 큐 옵션(배치/재시도)은 `src/platform/server/queue-config.ts` 한 곳에서 바꾼다.

## 명령

- `pnpm -C apps/web dev` / `build` / `test` / `typecheck`
- `pnpm -C apps/web test:e2e`: 공개 신청 E2E(Playwright). 5179 포트에 개발 서버를 띄우고 메모리 응답 저장소를 쓴다. 로컬 D1에는 E2E 전용 폼(`e2e-public-form`)만 지우고 다시 넣는다 (`e2e/seed.ts`). 처음 한 번 `pnpm -C apps/web exec playwright install chromium`
- `pnpm -C apps/web test:performance`: production 모바일 전 페이지 성능 예산(페이지별 5회, 실험실 p75). 공개 더미 바인딩·별도 D1·메모리 응답을 쓴다. `typecheck`/E2E/dev와 동시에 실행하지 않는다. 조건·범위·운영 지표의 차이는 `docs/performance/README.md`.
- `pnpm -C apps/web db:generate` → `void db migrate` (로컬) → `void deploy` (원격 적용)
- `pnpm env:sync`: `config/env/production/.env`를 Worker Secrets로 동기화. `pnpm deploy:production`: 동기화 후 배포. 실제 운영 파일을 읽으므로 AI 자동 검증에서 실행하지 않는다. 앱 폴더에서는 `pnpm run deploy`(`pnpm deploy`는 pnpm 내장 명령)

<!--injected-by-void-v1.6.2-->

## Void

- This project uses [Void](https://void.cloud), a full-stack Vite framework for Cloudflare Workers with file-based API routing, server-rendered pages, and typed backend services.
- Use Void's CLI and typed APIs. Before working with Void, read the relevant Markdown docs in `node_modules/void/docs/`; start with `guide/quickstart.md` for setup and `reference/cli.md` for commands.

<!--/injected-by-void-->
