# ADR-0021: 운영 비밀값 동기화와 배포 스크립트

- 상태: 채택 (루트 위임 방식은 ADR-0024가 turbo 작업으로 대체)
- 작성일: 2026-11-09
- 변경: ADR-0018의 "운영 값은 `void secret put`으로 개별 등록" 절차

## Problem 1-Pager

- 배경: 운영 값은 Worker Secrets가 원본이고, 항목마다 `void secret put`으로 등록했다. 사용자가 운영 값을 `config/env/production/.env`에 모아 두었다.
- 문제: 항목이 20개 가까이 돼 개별 등록은 빠뜨리기 쉽다. 문서의 `pnpm -C apps/web deploy`는 스크립트가 아니라 pnpm 내장 `deploy` 명령을 실행한다.
- 목표: 운영 파일 동기화와 배포를 스크립트 하나씩으로 실행한다.
- 비목표: CI 자동 배포, 스테이징 대상, 원격 Secret 삭제.
- 제약: 개발용 `.env`는 운영에 올리지 않는다. 값을 출력하지 않는다. AI 자동 검증은 이 스크립트를 실행하지 않는다.

## 대안

| 대안                                                     | 장점                                                                                 | 단점·위험                                     | 결정   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- | ------ |
| `void secret sync`를 부르는 package 스크립트             | void가 `env.ts` 선언·값 검증, 확인 프롬프트, 이름만 출력을 이미 제공. 코드 추가 없음 | 파일 권한(`600`) 검사는 하지 않음             | 채택   |
| dotenv 파일을 읽어 `secret put`을 반복하는 자체 스크립트 | 권한 검사 등 추가 규칙을 넣을 수 있음                                                | 파싱·검증·값 비노출을 직접 구현·테스트해야 함 | 미채택 |

## 결정과 영향

- `apps/web`: `env:sync` = `void secret sync ../../config/env/production/.env`, `deploy:production` = `pnpm run env:sync && pnpm run deploy`. 루트에도 같은 이름으로 위임한다.
- 동기화는 대화형 확인을 거친다. `--yes`를 넣지 않아 CI·비대화형 셸에서는 실패한다. 파일에 없는 원격 Secret은 지우지 않는다.
- `void deploy`는 로컬 파일을 올리지 않으므로, 비밀값 변경이 없으면 `pnpm -C apps/web run deploy`만 실행해도 된다.
- 문서의 `pnpm -C apps/web deploy`를 `run`을 붙인 형태나 `pnpm deploy:production`으로 고친다.
- 가정: `config/env/production/.env`는 배포 담당자의 컴퓨터에만 있고 Git에서 제외된다. 권한 `600`은 문서로 안내한다.

## 검증

- `apps/web/test/deployment-scripts.test.ts`: 스크립트 3개가 없어서 먼저 실패했고, 추가 후 5개 모두 통과했다.
  - 운영 파일 경로
  - 동기화 후 배포 순서
  - 루트 위임
  - 운영 파일 Git 제외
  - 예시 키가 모두 `env.ts`에 선언됨
- 실제 동기화·배포는 실행하지 않았다.
