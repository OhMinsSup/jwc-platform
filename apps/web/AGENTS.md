# apps/web AGENTS.md

TanStack Start + void(Cloudflare Workers). 공개 신청 화면, 관리자 콘솔, 큐/크론 소비자.

## 구조

| 경로                              | 역할                                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/schema/*`                     | D1 Drizzle 스키마 (auth, forms, submissions). 변경 후 `pnpm db:generate` → 마이그레이션 커밋                                                                   |
| `src/routes/`                     | 파일 라우트. `admin/_console/*`는 서버에서 세션+허용목록 검사                                                                                                  |
| `src/functions/`                  | 서버 함수 경계. 입력은 zod로 검증, 결과는 `Result<T>` 값으로 반환                                                                                              |
| `src/server/services/`            | 유스케이스 (submit, sync, notify, reminders, webhook, admin-forms)                                                                                             |
| `src/server/repositories/`        | D1 접근만                                                                                                                                                      |
| `src/server/google/`, `solapi.ts` | 외부 API 클라이언트 (fetch 주입 가능, 계약 테스트 있음)                                                                                                        |
| `src/server/runtime.ts`           | env를 읽는 유일한 곳                                                                                                                                           |
| `src/form-engine/`                | 정의 기반 렌더러. 필드 타입 → 컴포넌트 테이블                                                                                                                  |
| `src/components/admin/`           | 관리자 공통 UI (셸, 페이지 머리, 상태 배지, 요약 수치, 필터, 빈 상태). 메뉴/탭/상태색은 각 파일 상단의 표에서 추가한다. 브랜드/상태 색 토큰은 `src/styles.css` |
| `src/form-builder/`               | 관리자 폼 편집기 (ADR-0003). `model/` = 순수 리듀서/참조 연쇄/파생 인덱스(테스트 대상), `ui/` = 컴포넌트                                                       |
| `queues/`, `crons/`               | 소비자/작업. 운영 연결은 `server.ts` + `void.config.ts` (ADR-0002)                                                                                             |
| `scripts/apps-script/Code.gs`     | 시트 onEdit → 서명된 웹훅                                                                                                                                      |

## 규칙

- 답변 원문을 D1에 저장하지 않는다. 큐 payload는 항상 `encryptJson`으로 암호화한다.
- 로그에 전화번호/본문/토큰을 남기지 않는다 (`log`가 마스킹하지만 넘기지 않는 것이 원칙).
- `queues/*.ts`의 옵션 export와 `crons/*.ts`의 `cron`은 void가 정적으로 읽으므로 리터럴만 쓴다.
- 큐 옵션(배치/재시도)은 `src/server/queue-config.ts` 한 곳에서 바꾼다.

## 명령

- `pnpm -C apps/web dev` / `build` / `test` / `typecheck`
- `pnpm -C apps/web db:generate` → `void db migrate` (로컬) → `void deploy` (원격 적용)
