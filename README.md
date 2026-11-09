# JWC 신청서

왈라폼처럼 폼을 **데이터(JSON 정의)** 로 구성하는 신청서 서비스. void.cloud(Cloudflare Workers) + TanStack Start.

- 폼 구성 데이터 → D1 (불변 버전으로 발행)
- 응답 → 응답 저장소 어댑터 (기본 Google Sheets = 주 DB, 폼마다 탭 1개). 운영자가 시트에서 고친 값(납입 여부 등)이 그대로 원본이다
- 관리자 → Better Auth (허용 이메일 + 초대 가입, SMS 가입 확인 + 필수 TOTP, 감사 기록)
- 관측 → 구조화 로그(requestId) + PostHog(분석/오류 추적/마스킹된 리플레이/기능 플래그, 선택)
- 알림 → Solapi SMS (신청/수정 완료 알림), 큐로 비동기 처리

설계 배경: `docs/adr/` (0001 아키텍처, 0002 구현 결정, 0003 폼 편집기, 0004 UI/타입 검증, 0005 툴체인, 0006 응답 저장소 어댑터, 0007 패키지/기능 구조)

## 구조

```
apps/web                      TanStack Start 앱 + 큐/크론 + D1 스키마
  src/features/<기능>/         기능 단위: domain(순수 판단) · model · server(해석기/D1) · functions(서버 함수) · ui
  src/platform/               공통 기반: env/어댑터 조립, 로그·오류·관측·보안 정책 표, 셸 UI, 분석 바인딩
  src/routes/                 파일 라우트
packages/form-core            폼 정의 스키마와 순수 함수 (검증·조건·시트 코덱·메시지)
packages/submission-store     응답 저장소 포트 + 어댑터(Google Sheets/메모리) + 계약 테스트
packages/google               서비스 계정 토큰, Sheets REST 클라이언트
packages/observability        요청 범위, 카탈로그 기반 로거, PostHog 서버 전송
packages/security             요청 판정, CSP/보안 헤더, 속도 제한, Turnstile
packages/analytics            브라우저 PostHog (카탈로그 기반)
packages/common               인코딩·Web Crypto·공용 유틸
packages/ui                   shadcn 컴포넌트 (base-nova + Base UI)
packages/ui-patterns          @jwc/ui 위의 재사용 UI 패턴 + 의미 색 토큰
tooling/typecheck             타입 검사 진입점 (tsrs / tsc 폴백)
tooling/typescript            공용 tsconfig
tooling/lint-plugins          레포 전용 린트 규칙 (배럴/재노출 금지)
```

의존 방향: `routes → features → platform → packages` (린트로 강제). 배럴 파일과 재노출은 쓰지 않는다 — 정의한 파일에서 직접 import한다. 결정 기록: `docs/adr/0007`.

개발 환경 선택부터 운영 점검·장애 복구까지는 [개발·배포·운영 가이드](docs/development-deployment-operations.md)를 참고한다.

## 로컬 개발

`config/env/development/.env.example`을 같은 폴더의 `.env`로 복사하고 개발용 값을 채운다. 기존 `.env`가 있으면 덮어쓰지 않는다.

```bash
pnpm install
pnpm -C apps/web with-env void db migrate
pnpm dev            # http://localhost:5173
```

`dev`는 `config/env/development/.env`를 dotenv-cli로 주입한다. 설정을 바꾼 뒤 같은 명령으로 서버를 다시 시작한다. 실제 `.env`는 Git에서 제외하며 앱 루트에는 만들지 않는다.

AI·자동 검증은 실제 `.env`를 사용하지 않고 `pnpm test`, `pnpm -C apps/web test:e2e`를 실행한다. 환경별 파일과 명령은 [환경 설정 목록](config/env/README.md), 설정·이전 절차는 [개발용 비밀값 관리](docs/development-secrets.md)를 따른다.

## 검사

| 명령                                    | 내용                                                            |
| --------------------------------------- | --------------------------------------------------------------- |
| `pnpm check` / `pnpm fix`               | 포맷 + 린트 (Vite+: Oxfmt + Oxlint), `fix`는 safe 자동 수정     |
| `pnpm test`                             | 전체 테스트 (`vp test run`)                                     |
| `pnpm typecheck`                        | 타입 검사 (tsrs, 미지원 플랫폼은 tsc)                           |
| `pnpm check:deps` / `pnpm check:unused` | 의존성 버전 일관성(syncpack) / 안 쓰는 파일·export·의존성(knip) |
| `pnpm verify`                           | 위 전부 (CI 기준)                                               |

커밋 시 스테이징 파일에 `vp check --fix`가 자동 실행된다. 툴체인 결정: `docs/adr/0005-*.md`

| 변수                                                   | 설명                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `SITE_URL`                                             | 공개 주소 (로컬은 `http://localhost:5173`)                                           |
| `BETTER_AUTH_SECRET`                                   | `openssl rand -hex 32`                                                               |
| `ADMIN_PHONES`                                         | 관리자별 SMS 인증 번호. `admin@example.org=01012345678` 형식으로 쉼표 구분           |
| `ADMIN_EMAILS`                                         | 관리자 이메일, 쉼표 구분                                                             |
| `ADMIN_SIGNUP_ENABLED`                                 | 첫 관리자 부트스트랩 허용 (계정이 0개일 때만 초대 코드 없이 가입). 이후 `false` 권장 |
| `DATA_KEY`                                             | `openssl rand -base64 32` (분실 시 연락처 복호화 불가)                               |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`   | 서비스 계정 JSON의 값                                                                |
| `GOOGLE_SPREADSHEET_ID`                                | 응답 스프레드시트 ID. 서비스 계정에 편집 권한 공유 필수                              |
| `SMS_MODE`                                             | `log`(기본, 발송 안 함) / `live`                                                     |
| `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER` | `SMS_MODE=live`일 때 필수                                                            |
| `POSTHOG_KEY`, `POSTHOG_HOST`                          | 선택. PostHog 분석/오류 추적/리플레이 (키가 없으면 아무것도 보내지 않음)             |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`           | 선택. 둘 다 있으면 공개 제출에 Cloudflare Turnstile 확인                             |

## 배포

```bash
cd apps/web
pnpm exec void connect --platform cloudflare  # 최초 대상 설정
pnpm exec void cloudflare status              # 계정·대상 확인
pnpm exec void secret put BETTER_AUTH_SECRET   # 표의 서버 변수마다 반복
pnpm exec void deploy                          # 마이그레이션 적용 포함
```

최초 배포 전 필수 설정과 이후 반복 배포·롤백은 [운영 배포 절차](docs/development-deployment-operations.md#6-최초-운영-배포)를 따른다. 현재 CI는 검증만 수행하며 자동 배포는 구성하지 않았다.

배포 후 할 일:

1. HTTPS `SITE_URL`, `ADMIN_EMAILS`, 이메일별 번호 `ADMIN_PHONES`를 설정한다. 최초 관리자도 여기에 본인의 이메일과 번호를 등록한다.
2. Solapi 등록 발신번호와 `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`를 설정하고 실제 인증 문자 발송을 위해 `SMS_MODE=live`를 사용한다. 이 설정은 기존 신청 알림 문자에도 적용된다.
3. 계정이 0개이고 `ADMIN_SIGNUP_ENABLED=true`이면 `/admin/signup`에서 초대 코드 없이 가입한다. 이메일·비밀번호와 등록된 번호를 입력하고, SMS 인증 후 계정을 만든다.
4. 이메일·비밀번호로 로그인하고 인증 앱(TOTP)을 등록한다. 복구 코드는 안전한 곳에 보관한다. 최초 가입 후 `ADMIN_SIGNUP_ENABLED=false`로 닫을 수 있다.
5. 다른 관리자는 초대 코드로 가입한다. 초대 전에 `ADMIN_EMAILS`와 `ADMIN_PHONES`에 이메일과 번호를 등록한다. 기존 계정도 SMS 확인과 TOTP 등록을 마쳐야 관리자 기능을 사용할 수 있다.
6. 관리자 화면에서 폼을 생성하고 발행한다. ADR-0002 §3의 미확인 가정도 확인한다.

## 폼 정의 예시

`packages/form-core/src/samples/retreat-2026.ts`(`@jwc/form-core/samples/retreat-2026`) 참고. 필드 타입: `short_text, long_text, number, phone, email, single_choice, multi_choice, boolean, date, time, datetime, rating, statement`. 조건 표시는 `showIf`, 금액은 `payment.amount`, 문자 템플릿은 `notifications`(`{{필드id}}`, `{{amount}}`, `{{account}}`, `{{link}}`, `{{title}}`).

## 인증과 복구

- 이메일은 로그인 식별자로 사용하며 이메일 소유 확인을 했다고 표시하지 않는다. 가입 확인은 이메일에 연결된 사전 등록 번호의 SMS로 한다.
- SMS 코드는 6자리, 유효 기간 5분, 오입력 한도 3회이며 한 번만 사용할 수 있다. 가입 확인과 비밀번호 복구 코드는 용도가 분리된다.
- 문자 발송은 IP와 수신 번호 기준으로 제한한다. `SMS_MODE=log`에서는 인증 문자를 보냈다고 성공 처리하지 않는다. 코드·문자 본문·전화번호는 로그에 남기지 않는다.
- 비밀번호 복구는 `/admin/forgot-password`에서 등록된 번호의 SMS로 한다. 비밀번호 변경은 기존 세션을 폐기하지만 TOTP 설정은 유지한다.
- 인증 앱을 사용할 수 없으면 로그인 2단계 화면에서 일회용 복구 코드를 사용한다.
- 기존 계정의 SMS 확인 화면은 `/admin/verify-phone`이다. 인증 후 다시 로그인한다. 등록 번호가 바뀌면 SMS 확인을 다시 거친다.

## 브라우저 검증

`pnpm -C apps/web test:e2e:install` 후 `pnpm -C apps/web test:e2e`를 실행한다.
공개 신청 성공/실패와 기존 관리자 SMS 확인·TOTP 등록·복구 코드 로그인을 검증한다.
E2E는 `.void/e2e`의 별도 D1 저장소에 가짜 계정과 만료되는 테스트용 SMS 코드를 넣는다. 실제 문자는 발송하지 않는다.
코드 발급·오입력·만료·재사용·동시 소비는 실제 Better Auth 처리기와 가짜 SMS 발송기로 검증한다. Solapi 전송은 HTTP 계약 테스트로 검증하며 운영 수신은 실제 설정 후 별도로 확인한다.
