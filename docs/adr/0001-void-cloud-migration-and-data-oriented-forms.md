# ADR-0001: void.cloud 마이그레이션 + 데이터 지향(Data-Oriented) 폼 엔진 재설계

- 상태: 채택 (Accepted) — 구현 시 변경점은 ADR-0002 참고
- 작성일: 2026-11-02
- 범위: 레포 전체 (apps/web, packages/*)

---

## 1. Problem 1-Pager

- **배경**: 현재 앱은 TanStack Start(1.141) + Convex(백엔드/DB/크론/워크풀) + Vercel(Nitro preset) 조합이며, 폼은 "2026 여름 수련회 신청서" 하나에 하드코딩되어 있다.
- **문제**:
  1. 폼이 코드에 박혀 있어 질문 하나를 바꾸려면 Zod 스키마, Convex 스키마, 스텝 컴포넌트, zustand 스토어, 스프레드시트 컬럼, 웹훅 역매핑, SMS 템플릿을 모두 손봐야 한다.
  2. 같은 enum/라벨이 5곳에 중복된다(`@jwc/schema`, `backend/convex/lib/constants.ts`, `backend/convex/lib/onboardingHelpers.ts`, `backend/convex/spreadsheet.ts` 옵션 배열, `@jwc/utils/options`). 이미 값이 서로 어긋나 있다(예: 숙박형태 라벨 "3박4일" vs "3박4일 (전체 참석)").
  3. Convex/Vercel 종속으로 void.cloud(Cloudflare Workers)에 배포할 수 없다.
- **목표**:
  1. void.cloud(TanStack Start 최신)로 전체 이전.
  2. 왈라폼처럼 다양한 필드 타입을 조합하는 "폼 정의 데이터"를 DB(D1)에 저장하고, 그 정의 하나에서 검증/렌더/시트 컬럼/웹훅 역매핑을 **전부 파생**한다.
  3. 응답(설문 데이터)은 Google Sheets를 저장소로 사용한다.
  4. 기존 기능(SMS 환영/수정/미입금 알림, 단축 URL, 시트 편집 역동기화, 신청 상세 페이지) 유지.
- **비목표**(1차 범위 밖): 폼 빌더 관리 UI(드래그앤드롭), 파일 업로드 필드, 다국어, Excel 다운로드(exceljs), 결제 연동.
- **제약**:
  - void의 framework 모드는 Void 관리 auth를 지원하지 않는다 → Better Auth 직접 연동.
  - Workers 런타임: `node:crypto`/`Buffer`/`googleapis`/`solapi` SDK 등 Node 전용 의존성은 그대로 못 쓴다.
  - Google Sheets API 할당량(프로젝트당 분당 300 read/300 write), 단일 셀 동시 쓰기에 락이 없다.
  - 개인정보(전화번호)는 평문 로그 금지, DB에는 암호화/해시만.

---

## 2. 현재 구조 진단 (읽은 범위)

| 영역          | 현재                                                                                  | 문제                                                               |
| ------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 배포          | Vercel + `nitro({preset:"vercel"})`                                                   | void는 `voidPlugin()`이 nitro 역할을 대체                          |
| DB            | Convex `onboarding`, `shortUrls`, `users`                                             | Convex 전용 API(`ctx.db`, workpool, crons)                         |
| 비동기        | `@convex-dev/workpool` 2개(sms, spreadsheet)                                          | → Cloudflare Queues(`defineQueue`)                                 |
| 크론          | `crons.daily(00:30 UTC)` 미입금 알림                                                  | → `crons/*.ts` + `defineScheduled`                                 |
| 암호화        | `node:crypto` webcrypto + `Buffer`                                                    | Workers는 전역 `crypto.subtle` 사용, Buffer는 `nodejs_compat` 필요 |
| 시트          | `googleapis` + `google-auth-library` JWT, 전량 clear→rewrite                          | Node 전용, 매 제출마다 전체 재작성(O(n))                           |
| SMS           | `solapi` SDK                                                                          | Node 전용 가능성 높음 (스파이크 필요)                              |
| 폼 상태       | zustand 스토어가 스텝별 슬라이스(PersonalInfo…) 고정                                  | 폼 정의와 무관하게 하드코딩                                        |
| 시트 역동기화 | Apps Script `onEdit` → `/api/webhook/spreadsheet` → 한글 헤더로 분기(`fieldUpdaters`) | 헤더 문자열이 곧 프로토콜                                          |

---

## 3. 대상 아키텍처

```
[브라우저]  TanStack Start (SSR, React 19.3)
    │  server functions (createServerFn)
    ▼
[Cloudflare Worker via void 1.5]
    ├─ D1 (void/db, Drizzle)  : forms, form_versions, submissions(index), message_log, auth 테이블
    ├─ KV (void/kv)           : short_urls, google access token 캐시, 시트 row 조회 캐시
    ├─ Queue (defineQueue)    : sheet-writes (직렬화+재시도), sms-send
    ├─ Cron (defineScheduled) : payment-reminder (매일 00:30 UTC = 09:30 KST)
    └─ fetch                  : Google Sheets REST, Solapi REST
[Google Sheets]  폼 버전별 응답 시트 (응답 저장소) ←→ Apps Script onEdit 웹훅
```

Convex → Void 매핑

| Convex                      | Void / Cloudflare                                               |
| --------------------------- | --------------------------------------------------------------- |
| `query`/`mutation`/`action` | TanStack `createServerFn` + `void/db`                           |
| `internalAction` + workpool | `defineQueue` 소비자 + `queues.X.send()`                        |
| `cronJobs()`                | `crons/payment-reminder.ts`                                     |
| `defineSchema` + `v.*`      | `db/schema.ts` (Drizzle, `void/schema-d1`) + Zod                |
| `@convex-dev/better-auth`   | `better-auth` 1.7 + Drizzle adapter(D1) + TanStack Start 핸들러 |
| `ConvexHttpClient`(웹훅)    | 같은 Worker 내부 함수 호출                                      |

최신 버전(2026-11-02 npm 기준): `void 1.5.0`, `@tanstack/react-start 1.169.4`, `@tanstack/react-router 1.170.46`, `vite 8.3.5`, `react 19.3.1`, `better-auth 1.7.15`, `zod 4.6.7`, `tailwindcss 4.3.3`, `@tanstack/react-form 1.33.5`. (Drizzle은 void가 번들함)

---

## 4. 응답 저장소 대안 비교

| 대안                                                                                                                               | 장점                                                        | 단점                                                                                                | 위험                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| A. **Sheets만** (응답 전부 시트, DB는 폼 정의만)                                                                                   | 요구사항 그대로, 운영자가 시트에서 바로 편집                | ID로 1건 조회에 API 왕복(수백 ms), 중복 제출 판정/크론 대상 조회마다 전체 시트 읽기, 동시 쓰기 경합 | 할당량 초과, 전화번호 평문이 유일 사본                |
| B. **D1만** + 시트는 읽기 전용 투영                                                                                                | 트랜잭션/인덱스/유니크 제약                                 | "시트가 DB"라는 요구와 어긋남, 역동기화 의미 축소                                                   | 요구사항 불일치                                       |
| C. **하이브리드(채택)**: 답변 본문은 Sheets, D1에는 **얇은 인덱스**(id, formVersionId, dedupeHash, 암호화 연락처, 상태, 알림 이력) | 시트가 응답의 원본이면서, 중복/조회/크론은 D1 인덱스로 O(1) | 두 저장소 정합성 관리 필요(큐로 해결)                                                               | 큐 실패 시 인덱스-시트 불일치 → 재시도+멱등 키로 완화 |

채택: **C**. "답변 데이터의 원본은 시트"라는 요구를 지키되, 시트가 못 하는 일(유니크, 인덱스, 암호화 보관)만 D1이 맡는다.

---

## 5. 데이터 지향 설계 원칙 적용

적용하는 원칙(Data-Oriented Programming 4원칙)과 이 프로젝트에서의 구체적 의미:

1. **코드와 데이터 분리** — 폼은 클래스/컴포넌트가 아니라 **JSON 값**(`FormDefinition`)이다. 렌더러/검증기/시트 코덱은 그 값을 입력받는 순수 함수.
2. **범용 자료구조로 표현** — 답변은 `Record<fieldId, AnswerValue>` 하나. 스텝별 슬라이스(PersonalInfo/AttendanceInfo…) 삭제. 옵션은 `{value,label}[]`로 정의 안에 포함 → 라벨 중복 5곳이 0곳이 된다.
3. **불변 데이터** — 폼 정의는 `form_versions`로 **버전 고정**. 응답은 제출 당시 버전 ID를 가리키므로 시트 컬럼과 정의가 영원히 일치한다.
4. **스키마와 표현의 분리, 경계에서 검증** — Zod 검증기는 정의에서 `buildValidator(def)`로 파생. I/O 경계(서버 함수 입력, 웹훅 페이로드, 시트 셀 → 값)에서만 검증/코덱 수행. 내부는 이미 검증된 값만 흐른다.

현재 코드에서 제거되는 "데이터를 코드로 쓴 것들":

- `SchemaBuilder`/`ColumnBuilder`/`Proxy` 체이닝(`packages/spreadsheet/src/core/schema.ts`) → 컬럼 매핑은 정의에서 파생된 배열 값.
- `fieldUpdaters`(한글 헤더 → 업데이트 함수 맵) → 정의의 `fieldId ↔ header` 매핑 + 타입별 `decode` 함수 테이블.
- `STAY_TYPE_LABELS` 등 라벨 상수 × 5 → 정의 내 `options`.
- `STEPS`/`STEP_LABELS`/`isValidStep`/`getNextStep` → `def.pages`에서 파생.

---

## 6. 폼 정의 데이터 모델 (`packages/form-core`)

```ts
// 모든 필드는 공통 메타 + 타입별 설정의 discriminated union
type FieldBase = {
	id: string; // 불변 키 (예: "f_phone"), 시트/답변/로직 모두 이 id로 참조
	label: string; // 사람용 라벨 (시트 헤더 기본값)
	description?: string;
	required: boolean;
	columnKey?: string; // 시트 헤더 override. 없으면 label
	pii?: "phone" | "name" | "none"; // 개인정보 취급 표시 → 로그 마스킹/암호화 대상
	showIf?: Condition; // 조건 표시 (왈라 "로직")
};

type FieldDef = FieldBase &
	(
		| {
				type: "short_text";
				minLength?: number;
				maxLength?: number;
				pattern?: string;
		  }
		| { type: "long_text"; maxLength?: number }
		| { type: "number"; min?: number; max?: number; integer?: boolean }
		| { type: "phone"; region: "KR" }
		| { type: "email" }
		| {
				type: "single_choice";
				options: Option[];
				display: "chips" | "radio" | "dropdown" | "cards";
		  }
		| {
				type: "multi_choice";
				options: Option[];
				minSelect?: number;
				maxSelect?: number;
		  }
		| { type: "boolean"; trueLabel: string; falseLabel: string }
		| { type: "date"; min?: string; max?: string } // "YYYY-MM-DD"
		| { type: "time"; stepMinutes?: number } // "HH:mm"
		| { type: "datetime"; min?: string; max?: string; timezone: "Asia/Seoul" }
		| { type: "rating"; max: 5 | 10 }
		| { type: "statement" } // 표시 전용, 답변 없음
	);

type Option = {
	value: string;
	label: string;
	description?: string;
	meta?: Record<string, unknown>;
};
// meta 예: 숙박형태 옵션에 { fee: 65000 } → SMS 금액은 여기서 파생

type Condition =
	| { op: "eq" | "neq"; fieldId: string; value: string | number | boolean }
	| { op: "in"; fieldId: string; values: string[] }
	| { op: "truthy"; fieldId: string }
	| { op: "and" | "or"; conditions: Condition[] };

type Page = {
	id: string;
	title: string;
	description?: string;
	fieldIds: string[];
	showIf?: Condition;
};

type FormDefinition = {
	title: string;
	description?: string;
	pages: Page[];
	fields: FieldDef[];
	identity: { dedupeFieldId: string }; // 중복 제출 판정 키 (예: "f_phone")
	sheet: { systemColumns: SystemColumn[] }; // ID, 제출일시, 수정일시, 납입여부 등 운영 컬럼
	messaging?: {
		onCreate?: TemplateId;
		onUpdate?: TemplateId;
		reminder?: ReminderRule;
	};
};

type AnswerValue = string | number | boolean | string[] | null;
type Answers = Record<string, AnswerValue>;
```

현재 수련회 폼은 이 모델로 1:1 표현된다(seed로 제공):

- `f_name` short_text(required, pii=name), `f_phone` phone(required, pii=phone), `f_gender` single_choice(chips), `f_department` single_choice(chips), `f_age_group` single_choice(dropdown, 86~08또래)
- `f_stay_type` single_choice(cards, options.meta.fee), `f_attendance_at` datetime(showIf: stay_type ≠ 3nights4days, min/max 2026-06-25~28), `f_pickup_note` long_text(showIf 동일)
- `f_tf_team` single_choice, `f_can_ride` boolean, `f_ride_details` long_text(showIf f_can_ride)
- `f_tshirt` single_choice(optional) — 현재 UI에서 꺼져 있으므로 정의에서 `pages`에 포함하지 않으면 자연스럽게 비활성
- systemColumns: `id`, `submitted_at`, `updated_at`, `is_paid`(운영자 편집, boolean, 역동기화 대상)

---

## 7. D1 스키마 (`apps/web/db/schema.ts`, Drizzle)

```ts
forms           (id, slug UNIQUE, title, status 'draft'|'published'|'closed', current_version_id, created_at, updated_at)
form_versions   (id, form_id, version INT, definition JSON, sheet_spreadsheet_id, sheet_name, column_map JSON, published_at)
                 -- definition/column_map은 발행 후 불변
submissions     (id, form_version_id, dedupe_hash UNIQUE(form_id, dedupe_hash), contact_encrypted JSON, status JSON,
                 sheet_row_id TEXT, submitted_at, updated_at)
                 -- 답변 본문은 저장하지 않는다. status 예: { isPaid:false, reminder:{sentCount:1,lastSentAt:...} }
message_log     (id, submission_id, kind 'welcome'|'update'|'reminder', provider_id, result, created_at)
-- Better Auth: user, session, account, verification (CLI generate)
```

단축 URL은 KV로 이동: `short:{code}` → `{targetUrl, submissionId, type}`(TTL 없음). 충돌 검사는 `kv.get` 후 put.

---

## 8. Google Sheets 저장 설계

- **시트 1개 = 폼 버전 1개**. 헤더 행 = `[...systemColumns.header, ...fields.map(columnKey ?? label)]`. `column_map`(D1)에 `{fieldId → columnIndex}`를 저장해 라벨 변경에도 안전.
- **쓰기 경로**: 서버 함수는 D1 인덱스 upsert(트랜잭션) 후 `queues.sheetWrites.send({ submissionId, op:"upsert" })`만 한다. 큐 소비자(동시성 1)가 `toSheetRow(def, answers)`로 행을 만들어 신규면 `values.append`, 기존이면 ID 컬럼 검색 후 해당 행 `values.update`. 전체 재작성(현재 방식) 폐지.
- **읽기 경로**(`/application/$id`): D1에서 submission → `sheet_row_id`로 행 읽기(`values.get` 범위 1행) → `fromSheetRow(def, row)` → KV 60초 캐시.
- **역동기화**: Apps Script 페이로드를 `{spreadsheetId, sheetName, header, id, newValue}`로 유지하되, 서버는 `column_map`으로 `header → fieldId | systemColumn`을 찾고 타입별 `decodeCell`로 값 복원. systemColumn `is_paid` 변경은 D1 `status` 갱신(크론 대상 변경). 필드 값 변경은 시트가 원본이므로 D1 변경 없음(캐시 무효화만).
- **직렬화 필요 근거**: 두 요청이 같은 행을 동시에 update하면 마지막 쓰기만 남는다. 큐 동시성 1 + 멱등 키(submissionId+updatedAt)로 해결. 필요 시 `defineDurableState`로 폼별 직렬 writer로 승격.
- **인증**: 서비스 계정 JWT(RS256)를 `crypto.subtle`로 서명 → `oauth2/token` → access token을 KV에 50분 캐시. `googleapis` 제거.

---

## 9. 순수 함수 코어 API (`packages/form-core`, I/O 없음, 100% 단위 테스트)

| 함수                                                                   | 입력 → 출력                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `buildValidator(def)`                                                  | `FormDefinition → ZodObject` (showIf가 거짓인 필드는 optional 처리) |
| `visibleFields(def, answers)` / `visiblePages(def, answers)`           | 조건 평가 결과                                                      |
| `nextPage(def, answers, currentPageId)` / `prevPage(...)`              | 페이지 네비게이션                                                   |
| `toSheetRow(def, columnMap, answers, system)`                          | `string[]` (셀 인코딩: datetime→"YYYY-MM-DD HH:mm" KST 등)          |
| `fromSheetRow(def, columnMap, row)`                                    | `{answers, system}` (셀 디코딩, 실패 시 `{fieldId, reason}` 수집)   |
| `decodeCell(field, text)`                                              | 단일 셀 → `AnswerValue \| DecodeError` (웹훅용)                     |
| `buildHeaderRow(def)` / `buildColumnMap(def)`                          | 시트 헤더/매핑                                                      |
| `renderTemplate(template, vars)` + `messageVars(def, answers, system)` | SMS 본문 파생(금액은 `options.meta.fee`)                            |
| `dedupeKey(def, answers)`                                              | 정규화 후 SHA-256 (전화번호 하이픈 제거)                            |

UI 렌더링은 `apps/web/src/form-engine/field-renderers.ts`의 **타입 → 컴포넌트 테이블**(`Record<FieldDef["type"], FC>`)로, switch 분기 없이 조회.

---

## 10. 모노레포 구조 변경

| 패키지                                | 결정                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                            | 유지. `void.config.ts`, `env.ts`, `db/schema.ts`, `db/migrations/`, `crons/`, `queues/` 추가. `nitro` 제거, `voidPlugin()`을 `tanstackStart()` 앞에 배치 |
| `packages/backend`(Convex)            | **삭제**                                                                                                                                                 |
| `packages/env`(t3-env-nextjs)         | **삭제** → `void/env`의 `defineEnv`                                                                                                                      |
| `packages/spreadsheet`                | **대체** → `packages/sheets`(Workers 호환 REST 클라이언트만). Excel 빌더는 비목표로 제거                                                                 |
| `packages/schema`                     | **대체** → `packages/form-core`(정의 타입, 코덱, 검증기 파생)                                                                                            |
| `packages/utils`                      | `date`/`format`/`common`만 유지. `crypto`는 `apps/web/src/server/crypto.ts`(전역 WebCrypto)로 이동, `options`는 삭제(정의로 흡수)                        |
| `packages/sms`                        | 신규. fetch + HMAC-SHA256 기반 Solapi 클라이언트, 템플릿은 데이터                                                                                        |
| `packages/ui`                         | 유지, 의존성만 최신화                                                                                                                                    |
| `tooling/scripts/app-scripts/code.gs` | 유지(페이로드 형식 동일), 주석의 Convex 언급만 수정                                                                                                      |

---

## 11. Workers 호환성 리스크와 대응

| 의존성                              | 문제                              | 대응                                                                                                                                             |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `googleapis`, `google-auth-library` | Node http/crypto 의존, 번들 수 MB | 자체 JWT 서명 + REST fetch (약 80 LOC) + 계약 테스트                                                                                             |
| `solapi` SDK                        | Node 전용일 가능성                | Phase 0에서 스파이크. 안 되면 HMAC 서명 fetch 클라이언트 작성                                                                                    |
| `node:crypto`, `Buffer`             | Workers 기본 없음                 | 전역 `crypto.subtle`, base64는 `Uint8Array`+`btoa` 유틸. 기존 암호문(AES-GCM, PBKDF2 고정 salt)과 **형식 호환 유지**해야 기존 데이터 복호화 가능 |
| `exceljs`                           | 무거움, Node API                  | 비목표로 제거                                                                                                                                    |
| `dayjs` tz 플러그인                 | Workers에서 `Intl` 지원됨         | 유지 가능. 단, 포맷/파싱은 `form-core` 코덱에 집중                                                                                               |
| `framer-motion`, `react-confetti`   | 클라이언트 전용                   | 영향 없음                                                                                                                                        |

---

## 12. 마이그레이션 단계 (각 단계는 독립 PR 단위로 작게)

**Phase 0 — 스파이크 (1~2일)**

- `pnpm` 모노레포 하위 `apps/web`에서 `void init` + `void deploy` 동작 확인(빈 TanStack Start 1.169).
- Solapi/Sheets REST 호출이 Workers에서 되는지 최소 스크립트로 확인.
- 산출물: 이 ADR의 "가정" 항목 갱신.

**Phase 1 — form-core (I/O 없음)**

- 타입, `buildValidator`, 조건 평가, 시트 코덱, 템플릿 변수 파생 + 테스트(성공/실패 경로, 경계값, KST/DST).
- 현재 수련회 폼을 `FormDefinition` seed로 작성하고, 현재 Zod `OnboardingFormSchema`와 **동일하게 판정하는 회귀 테스트** 추가.

**Phase 2 — 인프라 전환**

- `void.config.ts`, `env.ts`, `db/schema.ts` + migration, Better Auth(D1) 연결.
- `packages/sheets`, `packages/sms` 작성(계약 테스트: 가짜 fetch).
- 큐 소비자 2개, 크론 1개.

**Phase 3 — 웹 앱 재작성**

- `/f/$slug/$pageId`(정의 기반 렌더), `/application/$id`, `/s/$code`, `/api/webhook/spreadsheet`, `/api/auth/$`.
- zustand 스토어: `{ formVersionId, answers, pageId }`만.

**Phase 4 — 데이터 이전**

- Convex `onboarding` 전량 export → 새 시트에 `toSheetRow`로 적재 + D1 `submissions` 인덱스 생성(암호문은 형식 호환이므로 그대로 복사).
- 기존 단축 URL → KV 복사. Apps Script `WEBHOOK_URL` 교체.

**Phase 5 — 정리**

- Convex/Vercel 관련 패키지·환경변수·스킬 문서 삭제, `AGENTS.md`/`.github/skills` 갱신, `vercel.json` 삭제.

---

## 13. 가정 및 결정 필요 사항

가정(사용자 확인 전까지 이 문서가 기준):

1. 응답의 **원본은 Sheets**, D1은 인덱스만(§4 C안).
2. 전화번호는 D1에 **암호문**, Sheets에는 **평문**(운영자 연락용, 현재와 동일). SMS 발송은 D1 암호문을 복호화해 사용(시트 읽기 불필요).
3. 1차 범위에서 폼 정의는 **코드 seed + 관리자 서버 함수**로 생성/발행하고, 빌더 UI는 2차.
4. 폼 1개 = 스프레드시트 1개(버전마다 시트 탭 분리).
5. Vercel의 `/application/` 목록 페이지는 현재도 `/`로 강제 리다이렉트 중이므로, 관리자 로그인 뒤에만 노출되도록 변경.

결정 필요:

- Q1. 기존 2026 수련회 응답을 새 시트로 이전할지, 현 시트를 읽기 전용 아카이브로 둘지.
- Q2. 관리자 계정 방식: 이메일+비밀번호(현재) 유지 vs. 허용 이메일 목록.
- Q3. 운영자가 시트에서 **답변 필드**(예: 숙박형태)를 바꿨을 때 SMS 재발송을 할지(현재는 폼 수정 시에만 발송).

---

## 14. 참고

- void TanStack Start 통합: https://void.cloud/integrations/frameworks/tanstack-start
- void Cloudflare 바인딩/프로비저닝: https://void.cloud/integrations/cloudflare
- void 설정 레퍼런스: https://void.cloud/reference/config
- void API 레퍼런스(`void/db`, `void/kv`, `void/handler`의 `defineScheduled`/`defineQueue`, `void/env`): https://void.cloud/reference/api
- void 배포/마이그레이션/시크릿: https://void.cloud/guide/deployment
- void DB(Drizzle, `@schema`, `void db generate`): https://void.cloud/guide/database
