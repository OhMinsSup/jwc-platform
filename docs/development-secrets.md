# 개발용 환경변수 관리

로컬은 `dotenv-cli`의 `dotenv` 명령으로 파일을 읽고, 운영은 Cloudflare Worker Secrets를 사용한다. 로컬 암호화와 키체인 등록 단계는 사용하지 않는다.

## 개발용 설정 준비

기존 `config/env/development/.env`가 있으면 덮어쓰지 않는다. 파일이 없으면 같은 폴더의 `.env.example`을 `.env`로 복사하고 개발용 값을 채운다. 운영 계정과 데이터를 사용하지 않는다.

저장소 루트에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm -C apps/web codegen
pnpm -C apps/web with-env void db migrate
pnpm dev
```

`http://localhost:5173`에서 앱을 연다. `pnpm -C apps/web dev`도 같은 개발용 `.env`를 읽는다. 값을 바꿨다면 개발 서버를 다시 시작한다.

## 명령별 설정

| 명령                                | 읽는 파일                          | 용도                              |
| ----------------------------------- | ---------------------------------- | --------------------------------- |
| `pnpm dev`                          | `config/env/development/.env`      | 로컬 개발                         |
| `pnpm -C apps/web with-env <명령>`  | `config/env/development/.env`      | 개발 설정을 사용하는 DB·설정 작업 |
| `pnpm -C apps/web test:e2e`         | `config/env/test/defaults.env`     | 공개 더미 값으로 E2E 검증         |
| `pnpm -C apps/web test:performance` | `config/env/performance/.dev.vars` | 공개 더미 값으로 성능 검증        |

주입 스크립트는 `dotenv --no-expand -o -e <파일> --`를 사용한다. `-o`는 파일의 값으로 상속된 환경변수를 덮는다. `--no-expand`는 값 안의 `$`를 그대로 전달한다. 여러 줄 값은 dotenv 파일의 큰따옴표와 `\n` 표현으로 작성할 수 있다.

앱 루트 `apps/web/.env`와 Vite가 자동 탐색하는 `.env.*`는 별도로 만들지 않는다. 환경 변수 스키마는 `apps/web/env.ts`, 서버 접근 경계는 `apps/web/src/platform/server/runtime.ts`에 유지한다. 전체 목록은 [환경 설정 목록](../config/env/README.md)을 참고한다.

## 비밀값 없는 자동 검증

AI·CI는 실제 `.env`를 제공하지 않는 환경에서 다음 명령을 사용한다.

```bash
pnpm verify
pnpm -C apps/web test:e2e
pnpm -C apps/web test:performance
```

단위 테스트는 독립된 fixture를 사용한다. E2E와 성능 검사는 각각 전용 더미 파일을 읽으며, 실제 Google Sheets·SMS·PostHog·Turnstile에 연결하지 않는다. SMS 인증은 테스트 데이터로 검증한다.

`pnpm dev`, `with-env`, `preview`는 실제 개발용 파일을 읽으므로 일반 AI 자동 검증에 사용하지 않는다. 실제 서비스 연동이 필요한 검증은 개발자가 별도로 수행한다.

## 로그인 성공 후 관리자 화면이 열리지 않을 때

비밀번호 로그인 성공과 관리자 접근 허용은 별도 단계다. 로그인 화면은 서버에서 쿠키 세션과 현재 관리자 등록을 확인한 뒤 휴대전화 인증, 2단계 인증 등록 또는 관리자 화면으로 이동한다. 허용되지 않은 계정과 세션 누락은 화면에 오류로 표시한다.

- 실제 관리자 인증은 Git에서 제외한 `config/env/development/.env`의 `ADMIN_EMAILS`에 로그인 이메일을 등록하고, `ADMIN_PHONES`에 같은 이메일의 `이메일=휴대전화번호` 매핑과 개발용 문자 발송 설정을 준비한 뒤 `pnpm dev`로 서버를 다시 시작한다.
- 세션을 확인하지 못했다면 브라우저가 쿠키를 허용하는지 확인하고, `SITE_URL`과 같은 호스트·포트의 주소로 접속한다. `localhost`와 `127.0.0.1`을 섞지 않는다.
- 휴대전화 인증과 TOTP 등록을 완료해야 관리자 화면에 접근할 수 있다. `emailVerified: false`만으로는 이 프로젝트의 관리자 접근을 차단하지 않는다.

## 이전 dotenvx 설정 다루기

dotenv는 암호문을 복호화하지 않는다. 이전 암호화 파일을 실제 연동용 `.env`로 그대로 복사하지 않는다.

기존 루트 `.env`는 값 출력 없이 `config/env/development/.env`로 옮겼다. 파일 내용과 권한 `600`, Git 제외를 확인했다. `config/env/archive/`의 `.env.root`, `.env.local`, `.env.production`도 같은 경로에 일반 dotenv 평문으로 복구했다. 복구 시 값 일치, 파일 권한 `600`, Git 제외를 확인했으며 원래 암호문은 `config/env/archive/.env.encrypted-backup/`에 보관한다. 보관본은 새 실행 스크립트에서 읽지 않는다.

앱에 dotenvx 직접 의존성과 암호화·키체인 등록 명령은 남기지 않는다. 이전 암호화 보관본만 가진 다른 컴퓨터에서는 안전한 환경에서 원래 값을 복구하거나 개발용 자격 증명을 다시 발급받아 `.env`를 준비한다.

## Git 제외와 접근 권한

`.env`는 평문이다. `.gitignore`는 Git 추적만 막고 AI나 같은 사용자로 실행되는 프로세스의 파일 접근을 막지 않는다.

- 실제 `.env`를 커밋하거나 채팅·로그·CI artifact에 넣지 않는다.
- AI는 실제 `.env`와 배포 자격 증명을 제공하지 않는 별도 사용자나 컨테이너에서 실행한다. 현재 이 격리 환경은 구성하지 않았다.
- 새 컴퓨터에는 허가된 비밀값 공유 경로로 개발용 설정을 전달한다. `.env`는 clone에 포함되지 않는다.
- `DATA_KEY` 등 운영 키의 복구 사본은 별도로 관리한다. 개발용 dotenv 파일을 운영 키 백업으로 사용하지 않는다.

## 운영 배포하기

먼저 [최초 운영 배포](development-deployment-operations.md#6-최초-운영-배포)에 따라 Cloudflare 계정과 배포 대상을 설정한다. 운영 값은 Worker Secrets에 개별 등록한다.

```bash
pnpm -C apps/web exec void secret put BETTER_AUTH_SECRET
pnpm -C apps/web deploy
```

`secret put`의 가려진 입력창에서 값을 입력한다. 로컬 `.env`를 운영에 업로드하지 않는다. 배포 토큰은 배포 프로세스에만 제공한다.
