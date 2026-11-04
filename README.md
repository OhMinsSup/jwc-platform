# JWC 신청서

왈라폼처럼 폼을 **데이터(JSON 정의)** 로 구성하는 신청서 서비스. void.cloud(Cloudflare Workers) + TanStack Start.

- 폼 구성 데이터 → D1 (불변 버전으로 발행)
- 응답 → 응답 저장소 어댑터 (기본 Google Sheets = 주 DB, 폼마다 탭 1개). 운영자가 시트에서 고친 값(납입 여부 등)이 그대로 원본이다
- 관리자 → Better Auth (허용 이메일 + 초대 코드로만 가입, 감사 기록)
- 관측 → 구조화 로그(requestId) + PostHog(분석/오류 추적/마스킹된 리플레이/기능 플래그, 선택)
- 알림 → Solapi SMS (신청/수정/미입금 알림), 큐로 비동기 처리

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

## 로컬 개발

```bash
pnpm install
cd apps/web
cp /dev/null .env   # 아래 표대로 채운다 (void는 .env 한 개만 읽는다)
pnpm exec void db migrate
pnpm dev            # http://localhost:5173 , 관리자: /admin/signup
```

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
pnpm exec void auth login
pnpm exec void secret put BETTER_AUTH_SECRET   # 표의 서버 변수마다 반복
pnpm exec void deploy                          # 마이그레이션 적용 포함
```

배포 후 할 일:

1. `/admin/signup`에서 첫 관리자 계정 생성(부트스트랩) → `ADMIN_SIGNUP_ENABLED=false`로 바꾸고 재배포. 다른 관리자는 관리자 화면 "관리자" 메뉴에서 초대 코드로 가입
2. 관리자 화면에서 폼 생성 → 편집기에서 페이지/질문/설정 구성 → 발행 (시트 탭과 헤더가 자동 준비됨)
3. ADR-0002 §3의 미확인 가정(큐 생성, Solapi 실발송)을 확인

## 폼 정의 예시

`packages/form-core/src/samples/retreat-2026.ts`(`@jwc/form-core/samples/retreat-2026`) 참고. 필드 타입: `short_text, long_text, number, phone, email, single_choice, multi_choice, boolean, date, time, datetime, rating, statement`. 조건 표시는 `showIf`, 금액은 `payment.amount`, 문자 템플릿은 `notifications`(`{{필드id}}`, `{{amount}}`, `{{account}}`, `{{link}}`, `{{title}}`).
