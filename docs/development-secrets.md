# 개발용 비밀값 관리

## 비밀값 없이 개발하기

저장소 루트에서 실행한다.

```bash
pnpm install
pnpm -C apps/web with-env void db migrate
pnpm dev
```

`http://localhost:5173`에서 앱을 연다. `pnpm -C apps/web dev`도 같은 설정을 사용한다.

- `config/env/development.env`는 공개 더미 설정이다. 실제 값을 넣지 않는다.
- 응답 저장소는 메모리다. 서버를 재시작하면 응답이 사라진다.
- 실제 Google Sheets, SMS, PostHog, Turnstile 연결은 사용하지 않는다.
- 문자 인증은 성공으로 가장하지 않는다. 실제 인증 검증은 아래 실제 연동 환경에서 수행한다.
- 상속된 실제 연동 설정은 더미 값으로 덮는다. 키체인과 외부 비밀 저장소 연결은 끈다.

## 실제 개발용 설정 만들기

운영용 계정과 데이터를 사용하지 않는다. 실제 키를 사용하는 작업은 검토한 코드로 실행한다.

1. 루트 `.env.example`을 `config/env/.env.development`로 복사한다.
2. AI가 접근하지 않는 편집 환경에서 개발용 값을 채운다.
3. 다음 명령으로 암호화한다.

```bash
pnpm -C apps/web env:encrypt
```

암호문은 `config/env/.env.development`, 복호화 키는 임시로 `config/env/.env.keys`에 생성된다. 두 파일 모두 기본적으로 Git에서 제외한다.

4. 복호화 키를 macOS 키체인으로 옮긴다.

```bash
pnpm -C apps/web env:keychain
```

dotenvx는 키체인에 저장한 키를 다시 읽어 일치 여부를 확인한 뒤 해당 개인키를 파일에서 제거한다. 키체인 작업이 실패하면 `.env.keys`를 지우지 말고 오류를 해결한다.

5. 실제 값을 출력하지 않고 환경 스키마를 검사한다.

```bash
pnpm -C apps/web with-env:real void env check
pnpm dev:real
```

`dev:real`은 키체인에서 복호화 키를 읽어 개발 프로세스에 값을 주입한다. 파일이나 복호화 키가 없으면 실행을 중단한다. 출력 마스킹은 보조 장치이며 접근 권한을 대신하지 않는다.

DB 작업에도 같은 주입 명령을 사용한다.

```bash
pnpm -C apps/web with-env:real void db migrate
```

앱 루트 `.env`와 Vite가 자동 탐색하는 `.env.*`를 별도로 만들지 않는다. dotenvx 파일은 `config/env/`에서만 읽는다. 앱의 변수 정의는 `apps/web/env.ts`, 서버 접근 경계는 `apps/web/src/platform/server/runtime.ts`에 유지한다.

## 기존 평문 파일 이전하기

기존 파일에 이미 값이 있다면 템플릿으로 덮어쓰지 않는다. 앱의 `.env`를 `config/env/.env.development`로 복사하고 위의 암호화·키체인 저장·스키마 검사를 수행한다. 성공한 뒤에만 평문 원본을 제거한다.

이번 로컬 이전에서는 다음 위치에 암호화된 사본을 보관한다. 보관본은 `dev`나 `dev:real`에서 읽지 않는다.

| 이전 위치         | 암호화된 위치                        |
| ----------------- | ------------------------------------ |
| `apps/web/.env`   | `config/env/.env.development`        |
| `.env`            | `config/env/archive/.env.root`       |
| `.env.local`      | `config/env/archive/.env.local`      |
| `.env.production` | `config/env/archive/.env.production` |

이전 파일의 값이 개발용인지 운영용인지는 암호화만으로 판단하지 않는다. 실제 연동 전 개발용 계정·스프레드시트·SMS 모드를 확인한다.

## 새 컴퓨터와 복구 준비하기

암호화 파일만 있어서는 복호화할 수 없다. 키체인은 클라우드 비밀 저장소나 자동 팀 공유를 대신하지 않는다.

- 암호화 파일과 복호화 키의 복구용 사본을 각각 안전하게 보관한다. 개인키는 비밀번호 관리자나 별도의 암호화 백업에 둔다.
- 키를 내보내야 하면 AI가 접근하지 않는 환경에서 `dotenvx native pull`을 사용한다. 개인키를 화면·로그·셸 명령 인수로 출력하지 않는다.
- 새 컴퓨터에는 암호문과 복구 키를 안전하게 전달하고 `env:keychain`으로 등록한다.
- 개발·스테이징·운영은 키와 계정을 분리한다. 키가 유출되면 실제 자격 증명도 교체한다. 암호문이나 복호화 키만 교체해도 이미 유출된 자격 증명은 유효하다.

## AI 작업 공간 분리하기

같은 사용자로 실행되는 AI가 키체인이나 실제 연동 프로세스에 접근할 수 있으면 비밀값을 읽을 수 있다. 저장소의 스크립트와 `.gitignore`만으로 이 접근을 차단할 수 없다.

AI는 실제 환경 파일·키체인·배포 자격 증명을 제공하지 않는 별도 사용자 또는 컨테이너에서 실행한다. 기본 `dev`와 테스트만 허용하고, 실제 연동 실행과 운영 배포는 검토한 코드로 별도 환경에서 수행한다.

## 운영 배포하기

먼저 [최초 운영 배포](development-deployment-operations.md#6-최초-운영-배포)에 따라 Cloudflare 계정과 배포 대상을 설정한다. 운영 값은 Cloudflare Worker Secrets에 개별 등록한다. 운영 Worker에 dotenvx나 개발용 복호화 키를 추가하지 않는다.

```bash
pnpm -C apps/web exec void secret put BETTER_AUTH_SECRET
pnpm -C apps/web deploy
```

`secret put`의 가려진 입력창에서 값을 입력한다. 배포 토큰은 배포 프로세스에만 제공한다. Turbo의 일반 개발·검증 작업에는 Cloudflare·Void 토큰을 전역 전달하지 않는다.

참고: [dotenvx 공식 문서](https://dotenvx.com/llms.txt), [Cloudflare Worker Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
