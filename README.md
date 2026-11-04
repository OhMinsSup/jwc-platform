# JWC 신청서

왈라폼처럼 폼을 **데이터(JSON 정의)** 로 구성하는 신청서 서비스. void.cloud(Cloudflare Workers) + TanStack Start.

- 폼 구성 데이터 → D1 (불변 버전으로 발행)
- 응답 → Google Sheets (폼마다 탭 1개, 운영자가 시트에서 직접 관리)
- 관리자 → Better Auth (허용 이메일만 가입/접근)
- 알림 → Solapi SMS (신청/수정/미입금 알림), 큐로 비동기 처리

설계 배경: `docs/adr/` (0001 아키텍처, 0002 구현 결정, 0003 폼 편집기, 0004 UI/타입 검증, 0005 툴체인)

## 구조

```
apps/web               TanStack Start 앱 + 큐/크론 + D1 스키마
packages/form-core     폼 정의 스키마와 순수 함수 (검증·조건·시트 코덱·메시지)
packages/ui            shadcn 컴포넌트 (base-nova + Base UI)
tooling/typecheck      타입 검사 진입점 (tsrs / tsc 폴백)
tooling/typescript     공용 tsconfig
```

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

| 변수                                                   | 설명                                                    |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `SITE_URL`                                             | 공개 주소 (로컬은 `http://localhost:5173`)              |
| `BETTER_AUTH_SECRET`                                   | `openssl rand -hex 32`                                  |
| `ADMIN_EMAILS`                                         | 관리자 이메일, 쉼표 구분                                |
| `ADMIN_SIGNUP_ENABLED`                                 | 관리자 계정을 만든 뒤 `false` 권장                      |
| `DATA_KEY`                                             | `openssl rand -base64 32` (분실 시 연락처 복호화 불가)  |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`   | 서비스 계정 JSON의 값                                   |
| `GOOGLE_SPREADSHEET_ID`                                | 응답 스프레드시트 ID. 서비스 계정에 편집 권한 공유 필수 |
| `SHEETS_WEBHOOK_SECRET`                                | `openssl rand -hex 32`, Apps Script 속성과 동일         |
| `SMS_MODE`                                             | `log`(기본, 발송 안 함) / `live`                        |
| `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER` | `SMS_MODE=live`일 때 필수                               |

## 배포

```bash
cd apps/web
pnpm exec void auth login
pnpm exec void secret put BETTER_AUTH_SECRET   # 표의 서버 변수마다 반복
pnpm exec void deploy                          # 마이그레이션 적용 포함
```

배포 후 할 일:

1. `/admin/signup`에서 관리자 계정 생성 → `ADMIN_SIGNUP_ENABLED=false`로 바꾸고 재배포
2. 관리자 화면에서 폼 생성 → 편집기에서 페이지/질문/설정 구성 → 발행 (시트 탭과 헤더가 자동 준비됨)
3. 스프레드시트에 `apps/web/scripts/apps-script/Code.gs`를 붙여 넣고 스크립트 속성 설정 후 `createTrigger()` 실행
4. ADR-0002 §3의 미확인 가정(큐 생성, Solapi 실발송)을 확인

## 폼 정의 예시

`packages/form-core/src/samples/retreat-2026.ts` 참고. 필드 타입: `short_text, long_text, number, phone, email, single_choice, multi_choice, boolean, date, time, datetime, rating, statement`. 조건 표시는 `showIf`, 금액은 `payment.amount`, 문자 템플릿은 `notifications`(`{{필드id}}`, `{{amount}}`, `{{account}}`, `{{link}}`, `{{title}}`).
