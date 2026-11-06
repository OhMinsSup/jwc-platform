# 개발용 환경변수 관리

로컬은 `dotenv-cli`의 `dotenv` 명령으로 파일을 읽고, 운영은 Cloudflare Worker Secrets를 사용한다. 로컬 암호화와 키체인 등록 단계는 사용하지 않는다.

## 비밀값 없이 개발하기

저장소 루트에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm -C apps/web codegen
pnpm -C apps/web with-env void db migrate
pnpm dev
```

`http://localhost:5173`에서 앱을 연다. `pnpm -C apps/web dev`도 같은 설정을 사용한다.

- `config/env/development.env`는 공개 더미 설정이다. 실제 값을 넣지 않는다.
- 응답은 메모리에 저장하므로 서버를 재시작하면 사라진다.
- 실제 Google Sheets, SMS, PostHog, Turnstile 연결은 사용하지 않는다.
- 문자 인증은 성공으로 가장하지 않는다. 실제 인증은 별도 개발용 계정으로 검증한다.
- `dotenv -o`로 상속된 실제 연동 설정을 더미 값으로 덮는다.

## 실제 개발용 설정 만들기

기존 루트 `.env`가 있으면 덮어쓰지 않는다. 파일이 없을 때 루트 `.env.example`을 `.env`로 복사하고, AI가 접근하지 않는 편집 환경에서 개발용 값을 채운다. 운영 계정과 데이터를 사용하지 않는다.

```bash
pnpm -C apps/web with-env:real void env check
pnpm dev:real
```

명령은 다음 두 설정으로 구분한다.

| 명령                                    | 읽는 파일                    | 용도                         |
| --------------------------------------- | ---------------------------- | ---------------------------- |
| `pnpm dev`                              | `config/env/development.env` | 비밀값 없는 기본 개발        |
| `pnpm dev:real`                         | 루트 `.env`                  | 실제 개발용 서비스 연동      |
| `pnpm -C apps/web with-env <명령>`      | 공개 더미 파일               | 기본 개발의 DB 작업·검증     |
| `pnpm -C apps/web with-env:real <명령>` | 루트 `.env`                  | 실제 연동 설정이 필요한 작업 |

두 주입 스크립트는 `dotenv --no-expand -o -e <파일> --`를 사용한다. `-o`는 파일의 값으로 상속된 환경변수를 덮는다. `--no-expand`는 비밀값 안의 `$`를 변수 치환하지 않고 그대로 전달한다. 여러 줄 값은 dotenv 파일의 큰따옴표와 `\n` 표현으로 작성할 수 있다.

실제 연동 개발의 로컬 DB 작업은 다음과 같다. `--remote`를 붙이지 않으면 로컬 D1 대상이다.

```bash
pnpm -C apps/web with-env:real void db migrate
```

앱 루트 `apps/web/.env`와 Vite가 자동 탐색하는 `.env.*`는 별도로 만들지 않는다. 환경 변수 스키마는 `apps/web/env.ts`, 서버 접근 경계는 `apps/web/src/platform/server/runtime.ts`에 유지한다.

## 이전 dotenvx 설정 다루기

dotenv는 암호문을 복호화하지 않는다. 이전 암호화 파일을 루트 `.env`로 그대로 복사하지 않는다.

이번 로컬 전환에서는 기존 실제 연동 설정을 값 출력 없이 루트 `.env`로 이전했다. `config/env/archive/`의 `.env.root`, `.env.local`, `.env.production`도 같은 경로에 일반 dotenv 평문으로 복구했다. 복구 시 값 일치, 파일 권한 `600`, Git 제외를 확인했으며 원래 암호문은 `config/env/.env.encrypted-backup/`에 보관한다. 보관본은 새 실행 스크립트에서 읽지 않는다.

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
