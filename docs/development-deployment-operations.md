# 개발·배포·운영 가이드

기준일: 2026-11-09. 현재 저장소의 스크립트와 설치된 Void 문서를 기준으로 한다. 개발자와 운영자가 같은 사람이어도 실행 환경과 자격 증명은 구분한다.

개발은 `pnpm dev` 하나를 사용하고, 운영은 Cloudflare Workers에 배포한다. 로컬 실제 설정은 Git에서 제외한 `config/env/development/.env`에 두고 dotenv-cli로 주입한다. 운영 설정은 해당 Worker의 Secrets에 등록한다.

이 문서는 일상 작업과 배포·운영 절차를 다룬다. 키 생성·이전·복구의 상세 절차는 [개발용 비밀값 관리](development-secrets.md), 설정 구조는 [환경 설정 목록](../config/env/README.md)과 [ADR-0018](adr/0018-environment-directories.md), 개발 규칙은 [AGENTS.md](../AGENTS.md)를 따른다.

## 1. 작업 환경 선택

| 환경       | 실행·검증 명령                      | 설정 공급원                                       | 외부 서비스·데이터                      | 담당                            |
| ---------- | ----------------------------------- | ------------------------------------------------- | --------------------------------------- | ------------------------------- |
| 개발       | `pnpm dev`                          | `config/env/development/.env`를 dotenv-cli로 주입 | 별도 개발용 Sheets·Solapi 계정으로 검증 | 실제 키 접근 권한이 있는 개발자 |
| 자동 검증  | `pnpm verify`, 웹 빌드, E2E         | 더미 설정·테스트 픽스처                           | 가짜 클라이언트, 메모리 응답, 로컬 D1   | 개발자·GitHub Actions           |
| E2E 테스트 | `pnpm -C apps/web test:e2e`         | `config/env/test/defaults.env`                    | E2E 전용 D1과 메모리 응답               | 개발자·CI                       |
| 성능 검사  | `pnpm -C apps/web test:performance` | `config/env/performance/.dev.vars`                | 성능 전용 D1과 더미 데이터              | 개발자·CI                       |
| 운영       | `pnpm -C apps/web deploy`           | Cloudflare Worker Secrets와 리소스 바인딩         | 운영 D1·Sheets·SMS                      | 배포 권한이 있는 운영자         |
| 스테이징   | 전용 명령·배포 대상 미구성          | 별도 키·계정·리소스 필요                          | 운영과 분리한 검증 데이터 필요          | 구성 후 담당자 지정             |

개발에서 `SUBMISSION_STORE=memory`이면 응답은 서버 재시작으로 사라진다. 폼 정의와 인증에 쓰는 로컬 D1은 메모리 응답 저장소와 별개다. `SMS_MODE=log`에서는 실제 SMS 인증이 성공하지 않는다. 관리자 화면 흐름은 가짜 인증 데이터를 사용하는 E2E로 검증한다.

개발 서버는 로컬에서 실행한다. Cloudflare 운영 비밀값을 내려받는 방식이 아니며, 운영 Worker가 로컬 `.env`를 읽지도 않는다.

## 2. 데이터와 서비스 구분

| 구성 요소                           | 저장·처리하는 것                                                                                     | 운영 시 확인할 것                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| TanStack Start + Cloudflare Workers | 공개 신청 화면, 관리자 화면, 서버 함수                                                               | 배포 버전, 도메인, 오류율·응답 시간          |
| D1                                  | 폼 초안·발행 버전, 관리자 인증·초대·감사 기록, 응답 식별 키·쓰기 락, SMS 발송 기록, 속도 제한 카운터 | 마이그레이션, 복구 지점, 접근 권한           |
| Google Sheets                       | 답변·연락처·납입 여부의 원본, 폼마다 탭 1개                                                          | 서비스 계정 편집 권한, API 오류, 원본과 백업 |
| Cloudflare Queues                   | 신청·수정 알림의 암호화된 SMS payload 전달                                                           | 적체, 처리 실패, 재시도, 공급자 발송 결과    |
| Solapi                              | 가입·복구 인증 문자, 신청·수정 알림 문자                                                             | 등록 발신번호, 잔액, 발송 결과·차단          |
| PostHog                             | 선택적 분석·오류 추적·마스킹된 리플레이                                                              | 키·수집 주소, 수집 정책, 오류 수집 여부      |
| Turnstile                           | 두 키가 모두 있을 때 공개 제출의 봇 확인                                                             | 등록 도메인, 클라이언트·서버 키 짝           |

신청 요청은 응답 저장소에 저장을 마쳐야 접수 성공으로 처리한다. SMS 알림은 큐에서 나중에 처리한다. D1은 응답 원본의 복제본이 아니므로 D1만 복구해서는 시트의 답변·납입 여부를 복구할 수 없다. 현재 시트 동기화 큐와 Apps Script 웹훅은 사용하지 않는다.

환경 변수 스키마는 `apps/web/env.ts`, 서버에서 설정을 읽고 클라이언트를 조립하는 경계는 `apps/web/src/platform/server/runtime.ts`다. 데이터 소유권은 [ADR-0006](adr/0006-submission-store-adapter.md)을 따른다.

## 3. 비밀값과 권한 관리

| 대상           | 보관 위치                                                          | Git 포함 | 사용 시점·주의점                                |
| -------------- | ------------------------------------------------------------------ | -------- | ----------------------------------------------- |
| 공개 더미 설정 | `config/env/test/defaults.env`, `config/env/performance/.dev.vars` | 포함     | E2E·성능 전용. 실제 값을 넣지 않는다            |
| 실제 연동 설정 | `config/env/development/.env`                                      | 제외     | `dev`에서 읽어 프로세스에 주입. 평문 파일       |
| 운영 서버 설정 | Cloudflare Worker Secrets                                          | 제외     | `void secret put <이름>`의 가려진 입력으로 등록 |
| 배포 자격 증명 | 배포 담당 환경의 Cloudflare 로그인 또는 전용 토큰                  | 제외     | 개발 프로세스에 전달하지 않는다                 |
| TOTP 복구 코드 | 관리자별 비밀번호 관리자                                           | 제외     | 인증 앱을 사용할 수 없을 때 일회용으로 사용     |

새로 clone하면 실제 연동용 `.env`는 없다. `config/env/development/.env.example`을 같은 폴더의 `.env`로 복사하고 허가된 경로로 개발용 값을 준비한다. 기존 파일이 있으면 덮어쓰지 않는다.

dotenv는 평문을 읽어 주입하는 도구다. `.gitignore`는 같은 OS 사용자로 실행되는 AI나 프로세스의 파일 접근을 차단하지 않는다. AI를 비밀값으로부터 격리하려면 실제 파일·배포 자격 증명에 접근할 수 없는 별도 사용자나 컨테이너에서 실행한다. 현재 이 격리 환경은 구성하지 않았다.

개발·스테이징·운영은 키와 서비스 계정을 분리한다. 기존 평문에서 이전한 값이 개발 전용인지 별도로 확인한다. 브라우저에 전달되는 값은 사용자가 볼 수 있으므로 비밀키를 `VITE_*`나 클라이언트 응답에 넣지 않는다.

## 4. 로컬 개발 시작

모든 명령은 저장소 루트에서 실행한다. Node.js는 `.nvmrc`의 24, pnpm은 `package.json`의 `packageManager`에 지정한 버전을 사용한다.

```bash
pnpm install --frozen-lockfile
pnpm -C apps/web codegen
pnpm -C apps/web with-env void db migrate
pnpm dev
```

`http://localhost:5173`에서 확인한다. `dev:server` 명령은 사용하지 않는다. `pnpm -C apps/web dev`도 같은 개발용 `.env`로 실행한다.

| 작업              | 명령                                        | 결과·영향                                               |
| ----------------- | ------------------------------------------- | ------------------------------------------------------- |
| 기본 개발 서버    | `pnpm dev`                                  | `config/env/development/.env`를 주입하고 개발 서버 시작 |
| 개발 설정 검증    | `pnpm -C apps/web with-env void env check`  | 개발용 `.env` 스키마 검사. AI 자동 검증에서는 사용 금지 |
| 로컬 DB 변경 적용 | `pnpm -C apps/web with-env void db migrate` | 기본 개발의 로컬 D1에 적용                              |
| 웹 빌드           | `pnpm -C apps/web build`                    | 배포용 산출물 생성. 업로드하지 않음                     |
| 빌드 결과 확인    | `pnpm -C apps/web preview`                  | 개발용 `.env`로 미리보기 서버 시작                      |

실제 연동의 최초 설정은 [개발용 설정 준비](development-secrets.md#개발용-설정-준비)를 따른다. 실제 설정은 `config/env/development/.env` 한 곳에 두고, 앱 루트에는 별도 `.env`나 `.env.*`를 만들지 않는다.

### 4.1. DB 조회와 스튜디오

| 조회 대상               | 도구·화면                                                           | 확인할 데이터                                   |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| 로컬 D1                 | Void의 Drizzle Studio                                               | 로컬 폼·관리자 인증·응답 식별 키·발송 기록      |
| 운영 D1                 | Cloudflare 대시보드의 D1 `Console`, 또는 `void db execute --remote` | 운영 폼·관리자 인증·응답 식별 키·발송 기록      |
| 실제 응답·납입 여부     | Google Sheets 또는 앱 관리자 화면                                   | 해당 환경의 원본 답변·납입 상태                 |
| 기본 개발의 메모리 응답 | 실행 중인 앱 화면                                                   | 메모리에만 있는 응답. D1 Studio에서는 조회 불가 |

로컬 D1은 저장소 루트에서 다음 명령으로 연다. DB를 아직 준비하지 않았다면 먼저 로컬 마이그레이션을 적용한다.

```bash
pnpm -C apps/web with-env void db migrate
pnpm -C apps/web with-env void db studio
```

실행 결과에 표시된 Studio 주소를 브라우저에서 연다. 테이블과 행을 조회·편집할 수 있다. 기본 명령은 일반 개발용 로컬 D1을 열며, E2E 전용 `.void/e2e` DB는 대상이 아니다.

운영 D1은 Cloudflare 대시보드에서 다음 순서로 조회한다.

1. 배포한 Cloudflare 계정의 **D1 SQL database**로 이동한다.
2. 운영 Worker에 연결된 데이터베이스를 선택한다.
3. **Console**에서 SQL을 실행한다. 예시는 [Cloudflare D1 시작 안내](https://developers.cloudflare.com/d1/get-started/)를 참고한다.

CLI에서는 배포 대상과 로그인 설정을 마친 환경에서 다음과 같이 필요한 컬럼만 조회한다.

```bash
pnpm -C apps/web exec void db execute --remote 'SELECT id, slug, status FROM forms LIMIT 20'
```

현재 Void의 D1 원격 조회는 `db studio --remote` 대신 `db execute --remote`를 사용한다. Studio와 Console의 데이터 수정은 앱의 검증·감사 기록 경로를 거치지 않으므로 업무 데이터 변경은 앱 관리자 기능을 우선 사용한다. 스키마 변경은 아래 마이그레이션 절차를 따른다. 인증 테이블·응답 데이터의 조회 결과를 AI 도구 출력이나 로그에 남기지 않는다.

## 5. 변경 검증과 DB 변경

| 검증                | 명령                                | 범위                                                  |
| ------------------- | ----------------------------------- | ----------------------------------------------------- |
| Void 타입·설정 생성 | `pnpm -C apps/web codegen`          | 새 clone에서 타입 기반 린트 전에 실행. CI도 먼저 수행 |
| 포맷·린트           | `pnpm check`                        | Vite+ 공통 설정                                       |
| 안전한 자동 수정    | `pnpm fix`                          | 적용 후 diff를 읽고 타입·테스트 재검증                |
| 의존성 버전         | `pnpm check:deps`                   | syncpack                                              |
| 미사용 코드·의존성  | `pnpm check:unused`                 | knip                                                  |
| 타입                | `pnpm typecheck`                    | tsrs, 미지원 플랫폼에서는 tsc                         |
| 단위·계약 테스트    | `pnpm test`                         | Vite+ 테스트                                          |
| 전체 기본 검증      | `pnpm verify`                       | 위 검사 중 자동 수정 제외. 빌드·E2E는 별도            |
| 웹 빌드             | `pnpm -C apps/web build`            | Workers용 앱 빌드                                     |
| E2E 준비            | `pnpm -C apps/web test:e2e:install` | Chromium과 실행 의존성 설치                           |
| E2E                 | `pnpm -C apps/web test:e2e`         | 공개 신청 성공·실패, 관리자 인증 흐름                 |

현재 GitHub Actions는 PR과 `main` 푸시에서 전체 검증·웹 빌드와 E2E를 실행한다. E2E는 5179 포트, `.void/e2e`의 로컬 D1, 메모리 응답을 사용하며 실제 문자는 보내지 않는다. 실패 trace는 CI artifact로 7일 보관한다. CI 성공은 실제 Sheets·Solapi 수신 검증을 대신하지 않는다. 현재 자동 배포 job은 없다.

D1 스키마를 바꿀 때는 다음 순서를 따른다.

1. `apps/web/db/schema.ts`를 변경한다.
2. `pnpm -C apps/web with-env void db generate`로 SQL을 생성한다.
3. `apps/web/db/migrations/`의 SQL을 읽고 삭제·복사·인덱스·기존 데이터 호환성을 검토한다.
4. 로컬 `db migrate` 후 검증·빌드·E2E를 수행한다.
5. 스키마와 마이그레이션 파일을 함께 리뷰한다. 운영 적용은 배포 단계에서 수행한다.

Void 배포는 마이그레이션이 없는 스키마 변경을 발견하면 중단한다. 이전 코드로 되돌려도 새 스키마에서 실행할 수 있도록 호환성을 고려한다.

## 6. 최초 운영 배포

이 절차는 사용자의 Cloudflare 계정에 직접 배포하는 경우다. Void 플랫폼 연결과 Cloudflare 직접 배포는 별도 대상이다. 저장된 대상·로그인·Worker가 이미 올바르게 설정됐다고 가정하지 않는다.

### 6.1. Cloudflare 대상 설정

배포 담당 환경에서 다음 명령을 실행한다.

```bash
pnpm -C apps/web exec void connect --platform cloudflare
pnpm -C apps/web exec void cloudflare status
```

대화형 설정에서 계정과 Worker 대상을 확인한다. 생성·변경되는 `void.config.ts`와 `void.lock.json`을 검토한다. 운영 도메인과 D1·큐가 의도한 계정에 속하는지 확인한다. 로컬 `.void` 상태에는 자격 증명이 포함될 수 있으므로 커밋하지 않는다.

배포 담당자에게는 Workers·D1·Queues 등 이 앱이 사용하는 리소스의 배포 권한을 준다. Google 서비스 계정에는 대상 시트의 편집 권한을 준다. 배포 자격 증명은 앱 런타임용 비밀값과 구분한다.

### 6.2. 운영 설정 등록

다음 표의 이름을 `void secret put`으로 각각 등록한다. 실제 값은 명령 인수·문서·채팅에 넣지 않는다.

| 설정                                                   | 운영에서 준비할 값·조건                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `SITE_URL`                                             | 실제 HTTPS 공개 주소. 인증 출처와 문자 링크에 사용                    |
| `BETTER_AUTH_SECRET`                                   | 운영 전용 랜덤 인증 키. 더미 값 사용 금지                             |
| `DATA_KEY`                                             | 운영 전용 32바이트 base64 키. 암호화·HMAC에 사용하므로 복구 사본 필수 |
| `ADMIN_EMAILS`, `ADMIN_PHONES`                         | 허용 이메일과 `이메일=휴대전화번호` 매핑. 개인정보로 취급             |
| `ADMIN_SIGNUP_ENABLED`                                 | 첫 관리자 생성 시 `true`, 완료 후 `false`                             |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`   | 운영 Sheets 서비스 계정                                               |
| `GOOGLE_SPREADSHEET_ID`, `SUBMISSION_STORE`            | 운영 스프레드시트 ID와 `sheets`. 운영에서 `memory` 사용 금지          |
| `SMS_MODE`                                             | 실제 인증을 위해 `live`. 신청 알림에도 같은 발송 모드 적용            |
| `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER` | `live`에 필요한 키·등록 발신번호                                      |
| `POSTHOG_KEY`, `POSTHOG_HOST`                          | 선택. 분석 수집 여부와 프로젝트·수집 주소 확인                        |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`           | 선택. 사용하면 운영 도메인에 맞는 두 키 모두 등록                     |

예를 들어 인증 키는 다음 명령의 가려진 입력창에서 입력한다.

```bash
pnpm -C apps/web exec void secret put BETTER_AUTH_SECRET
pnpm -C apps/web exec void secret list
pnpm -C apps/web exec void env check --remote
```

`secret list`는 값 없이 이름을 확인한다. 원격 환경 검사는 필수 비밀값의 이름 존재를 확인하며, 원격 값을 읽어 서비스 연결까지 검증하지 않는다. 로컬 `.env`는 배포 시 운영 값으로 업로드되지 않는다. 운영 설정은 Worker Secrets에서 별도로 관리한다.

### 6.3. 검증 후 배포

```bash
pnpm verify
pnpm -C apps/web build
pnpm -C apps/web test:e2e
pnpm -C apps/web deploy
pnpm -C apps/web exec void project status
```

E2E를 처음 실행하는 환경에서는 먼저 `test:e2e:install`을 실행한다. `deploy`는 저장된 배포 대상을 사용하며 빌드·리소스 준비·원격 마이그레이션·Worker 배포를 수행한다. 대상 설정을 마친 후 실행한다. Git 커밋, Worker 버전, 배포 시각과 D1 복구 지점을 값 노출 없이 배포 기록에 남긴다.

### 6.4. 첫 관리자와 운영 확인

1. 허용 이메일·번호를 등록하고 `SMS_MODE=live`인지 확인한다.
2. 관리자 계정이 0개이고 부트스트랩이 허용된 상태에서 `/admin/signup`으로 가입한다.
3. 실제 SMS 확인 후 로그인하고 TOTP를 등록한다. 일회용 복구 코드는 별도로 보관한다.
4. `ADMIN_SIGNUP_ENABLED=false`를 원격 설정에 반영한다. 후속 관리자는 허용 이메일·번호 등록 후 초대 코드로 가입시킨다.
5. 확인용 폼을 생성·발행하고 아래 항목을 점검한다.

| 점검           | 통과 기준                                                 |
| -------------- | --------------------------------------------------------- |
| 주소·인증      | HTTPS 공개 화면, 관리자 로그인·TOTP·로그아웃 정상         |
| 제출·실패      | 정상 제출은 시트에 저장, 잘못된 입력은 거절               |
| 응답 조회·수정 | 수정 내용이 같은 응답에 반영                              |
| 납입 여부      | 시트 변경과 관리자 조회가 일치                            |
| 알림           | 설정된 신청·수정 템플릿에 따른 큐 처리·실제 SMS 수신 확인 |
| 운영 로그      | 오류·큐 적체 확인, 답변·전화번호·토큰이 출력되지 않음     |
| 선택 기능      | 사용하는 경우 PostHog 수집과 Turnstile 성공·실패 확인     |

실제 수신 확인은 동의한 운영 담당자의 번호로 수행한다. 확인용 응답은 식별해 업무 집계에서 제외한다.

## 7. 반복 배포

1. 변경 diff와 마이그레이션을 리뷰하고 배포할 커밋을 정한다.
2. CI의 검증·빌드·E2E 성공을 확인한다. CI를 거치지 않은 변경은 같은 검증을 먼저 실행한다.
3. 대상 계정·Worker, 원격 설정 변경, D1과 Sheets의 복구 준비를 확인한다.
4. 배포 담당 환경에서 `pnpm -C apps/web deploy`를 실행한다.
5. `void project status`로 활성 버전을 확인하고 위 운영 점검을 변경 범위에 맞춰 수행한다.
6. 배포 결과·관찰된 문제·복구 지점을 기록한다. 실패 원인을 확인한 뒤 재배포한다.

비밀값 변경은 Worker 동작에 영향을 주는 운영 변경으로 취급한다. 개발용 `.env`를 수정해도 운영 설정은 바뀌지 않는다. 원격 값은 별도로 갱신한다.

## 8. 일상 운영과 장애 대응

아래 명령은 저장된 Cloudflare 배포 대상을 사용한다.

```bash
pnpm -C apps/web exec void project status
pnpm -C apps/web exec void project logs
```

Cloudflare 대상의 `project logs`는 실시간 로그다. 과거 로그 보관·검색과 자동 경보는 별도 구성이 필요하다. 오류를 조사할 때 `requestId`, 큐의 `traceId`, 응답 ID, 오류 코드를 연결한다. 비밀값이나 응답 본문을 티켓에 붙이지 않는다.

| 상황             | 확인·대응                                                                          |
| ---------------- | ---------------------------------------------------------------------------------- |
| 제출 실패        | 입력·공개 폼 상태, 속도 제한·Turnstile, Sheets 권한·할당량·오류를 확인             |
| 문자 미수신      | 인증 문자인지 큐 알림인지 구분. `SMS_MODE`, Solapi 발송 결과·잔액·발신번호 확인    |
| SMS 큐 적체·실패 | `sms.failed`·오류 코드, 큐 처리·재시도, D1 발송 기록과 Solapi 결과를 함께 확인     |
| 관리자 접근 실패 | 이메일·번호 허용 목록, SMS 확인 상태, TOTP·복구 코드 확인                          |
| 납입 상태 불일치 | 원본 시트의 해당 응답·셀과 관리자 조회 확인. D1에서 납입 값을 수정하지 않음        |
| 새 배포 오류     | 활성 버전·로그·스키마 호환성을 확인한 뒤 코드 롤백 또는 수정 배포 결정             |
| 키 유출          | 해당 자격 증명을 폐기·교체하고 영향 범위 조사. 암호문 재암호화만으로 종료하지 않음 |

현재 SMS 큐는 `jwc-form-sms`, 배치 최대 5건, 최대 재시도 5회, 재시도 지연 60초다. 재시도 가능한 오류는 재시도하고 그 외 오류는 로그 후 ack한다. Dead Letter Queue는 현재 설정에 없다. 재처리는 공급자 발송 결과까지 확인한 뒤 결정한다. 발송 후 D1 기록 전에 실패하면 중복 발송 가능성이 있으므로 정확히 한 번 전송을 보장한다고 판단하지 않는다.

정기 작업은 `30 0 * * *`, 매일 00:30 UTC, 한국 시각 09:30에 지난 속도 제한 카운터를 정리한다. 한국은 DST가 없다. 현재 미입금 독촉 문자는 자동 발송하지 않는다. 이전 큐 메시지의 제거된 알림 종류는 발송 경계에서 버린다. [ADR-0011](adr/0011-remove-payment-reminders.md)을 참고한다.

## 9. 롤백과 데이터 복구

코드, D1, Google Sheets, 운영 키는 복구 대상과 시점이 다르다.

| 복구 대상     | 방법                                                             | 실행 전 확인                                               |
| ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Worker 코드   | `pnpm -C apps/web exec void project rollback`에서 이전 버전 선택 | 이전 코드와 현재 D1 호환성. 트리거도 복원됐는지 확인       |
| D1            | 배포 전 복구 bookmark를 사용한 `void db restore`                 | 복구 지점 이후의 쓰기가 사라짐. 접수·관리자 변경 영향 확인 |
| Google Sheets | 시트 버전 기록 또는 별도 백업에서 복구                           | D1 응답 키·revision과 시트 상태를 함께 대조                |
| `DATA_KEY`    | 안전한 복구 사본에서 원래 키 복원                                | 임의 새 키로 교체하면 기존 암호문·HMAC과 호환되지 않음     |
| 관리자 TOTP   | 보관한 일회용 복구 코드 사용                                     | 복구 코드 보관·사용 여부 확인                              |

D1 복구 시 실제 배포 기록의 bookmark로 대체한다. 다음 명령은 데이터 복원을 수행하므로 영향 검토 후 운영 담당자가 실행한다.

```bash
pnpm -C apps/web exec void db restore --bookmark '실제-복구-bookmark' --platform cloudflare
```

복구 전에 접수와 관리자 변경을 통제하고 현재 데이터의 보존 방법을 정한다. D1 복구는 Sheets를 되돌리지 않고, 코드 롤백은 DB 마이그레이션을 되돌리지 않는다. 복구 후에는 양쪽 응답 식별자와 알림 기록을 대조하고 재시도·중복 발송 가능성을 점검한다. Time Travel의 복구 가능 기간은 계정 요금제와 현재 Cloudflare 정책에서 확인한다.

## 10. 운영 시작 전 남은 준비

| 항목                         | 현재 상태                   | 완료 기준                                               |
| ---------------------------- | --------------------------- | ------------------------------------------------------- |
| 개발·dotenv 주입             | 구현·로컬 검증 완료         | 신규 담당자가 문서대로 개발 시작                        |
| CI 검증·빌드·E2E             | 워크플로 구성 완료          | 배포할 커밋의 GitHub 실행 성공 확인                     |
| Cloudflare 직접 배포·운영 키 | 실제 계정·원격 상태 미검증  | 대상·필수 값·실제 연동·배포 후 점검 완료                |
| AI 실행 환경 격리            | 미구성                      | 실제 파일·배포 권한 접근 차단                           |
| 운영 키 복구 백업            | 별도 사본 미확인            | 운영 키의 안전한 복구 사본 보관과 복구 확인             |
| D1·Sheets 백업·복구          | 정기 백업·복구 훈련 미구성  | 주기·보관 기간·복구 목표·담당자 지정과 복구 시험        |
| 로그 보관·자동 경보          | 앱 로그·선택적 PostHog 지원 | 보관 기간, 오류·큐 적체 경보, 수신 담당자 설정          |
| 스테이징·자동 배포           | 미구성                      | 운영과 분리한 리소스·전용 배포 자격 증명·승인 절차 정의 |

배포·비밀값·DB 도구의 명령은 설치된 `void` 패키지의 `docs/guide/deployment.md`, `docs/reference/cli/secrets.md`, `docs/reference/cli/project.md`, `docs/reference/cli/database.md`와 대조한다. Void를 업데이트할 때 이 문서의 명령과 대상 선택 동작도 다시 확인한다.
