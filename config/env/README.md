# 환경별 설정

실제 개발용 값을 바꾸려면 `development/.env`를 수정하고 `pnpm dev`로 서버를 다시 시작한다. 이 문서의 명령은 저장소 루트 기준이다.

| 구분           | 파일                       | 명령                                           | Git 포함                  |
| -------------- | -------------------------- | ---------------------------------------------- | ------------------------- |
| 개발           | `development/.env`         | `pnpm dev`                                     | 제외: 실제 개발용 값      |
| 개발용 예시    | `development/.env.example` | 같은 폴더의 `.env`를 만들 때 복사              | 포함: 빈 키와 예시        |
| E2E 테스트     | `test/defaults.env`        | `pnpm -C apps/web test:e2e`                    | 포함: 테스트 전용 더미 값 |
| 퍼포먼스 검사  | `performance/.dev.vars`    | `pnpm -C apps/web test:performance`            | 포함: 성능 전용 더미 값   |
| 운영 등록 항목 | `production/.env.example`  | `pnpm -C apps/web exec void secret put <이름>` | 포함: 등록할 항목의 예시  |
| 이전 설정 보관 | `archive/`                 | 실행 시 읽지 않음                              | 전체 제외                 |

단위 테스트(`pnpm test`)는 테스트 코드의 독립된 fixture를 사용한다. 실제 개발용 `.env`를 읽지 않는다. AI는 `pnpm dev` 대신 `pnpm -C apps/web test:e2e` 등 테스트 전용 명령을 사용한다.

## 실제 개발용 설정 준비

`development/.env`가 없다면 `development/.env.example`을 같은 폴더의 `.env`로 복사하고 개발용 값을 채운다. 기존 파일은 덮어쓰지 않는다.

기존 루트 `.env`를 사용하던 이 작업 공간에서는 내용을 바꾸지 않고 `development/.env`로 옮겼다. 다른 컴퓨터도 기존 파일이 있다면 새 경로로 옮긴다. 루트와 앱 폴더에는 `.env`를 중복으로 두지 않는다.

관리자 로그인에는 `ADMIN_EMAILS`와 같은 이메일의 `ADMIN_PHONES` 매핑이 필요하다. 실제 SMS 인증을 하려면 개발용 문자 발송 키와 `SMS_MODE=live`를 준비한다. `pnpm dev`는 이 파일을 읽는다.

## 운영 값 등록

`production/.env.example`은 항목 목록이다. 실제 운영 값은 해당 Cloudflare Worker의 Secrets에 개별 등록한다. 이 파일을 자동으로 읽거나 개발용 `.env`를 운영에 업로드하는 스크립트는 없다.

배포는 `pnpm -C apps/web deploy`를 사용한다. 대상과 등록 절차는 [운영 가이드](../../docs/development-deployment-operations.md#6-최초-운영-배포)를 따른다.

## 값 추가와 보관

- 변수 이름·타입을 `apps/web/env.ts`에 추가하고 해당 환경의 예시·더미 파일을 갱신한다.
- 실제 값은 `development/.env`와 Cloudflare Secrets에 각각 등록한다. 실제 값이나 운영 키를 공개 더미 파일에 넣지 않는다.
- 개발, E2E, 성능 명령은 자기 파일 하나를 명시적으로 읽는다. `dotenv --no-expand -o`로 `$`를 보존하고 상속된 값을 덮는다.
- 성능 검사는 운영 방식으로 빌드하되 더미 값과 `.void/performance` DB를 쓴다. E2E는 `.void/e2e` DB를 쓴다. 공유 Void 생성 설정이 있으므로 dev·타입 검사·E2E·성능 검사는 동시에 실행하지 않는다.
- `.gitignore`는 Git 추적만 막는다. AI의 비밀 파일 접근을 차단하려면 별도 사용자나 컨테이너가 필요하다.

설정 이전·복구는 [비밀값 관리](../../docs/development-secrets.md), 폴더 구분의 이유는 [ADR-0018](../../docs/adr/0018-environment-directories.md)을 참고한다.
