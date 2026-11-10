# ADR-0024: 배포·비밀값 동기화를 turbo 작업으로 실행

- 상태: 채택
- 작성일: 2026-11-10
- 관련: ADR-0005(툴체인), ADR-0021(운영 비밀값 동기화와 배포 스크립트)
- 변경: ADR-0021의 "루트에도 `pnpm -C apps/web run …`으로 위임"

## Problem 1-Pager

- 배경: `build`·`dev`·`typecheck`는 루트에서 `turbo run`으로 실행하지만, `deploy`·`deploy:production`·`env:sync`만 `pnpm -C apps/web run`으로 앱 스크립트를 직접 불렀다.
- 문제: 실행 방식이 둘로 나뉜다. 배포 대상 앱이 늘거나 앞뒤 작업(검사 등)을 묶을 때 turbo 작업 그래프를 쓸 수 없다.
- 목표: 세 명령을 turbo 작업으로 통일하되, 기존 동작을 그대로 유지한다. 동작이란 확인 프롬프트, 동기화 성공 후에만 배포하는 순서, 인증 환경 변수 전달이다.
- 비목표: CI 자동 배포, 배포 전 검사 추가, 다중 앱 배포.
- 제약: 비밀값을 출력하지 않는다. 동기화는 계속 대화형 확인을 거친다. AI 자동 검증은 실제 동기화·배포를 실행하지 않는다.

## 결정

- 루트 스크립트: `turbo run <작업> --filter=web --env-mode=loose`. 대상 작업은 `env:sync`, `deploy`, `deploy:production`이다.
- `turbo.json`: 세 작업 모두 `cache: false`(배포는 매번 실행), `interactive: true`(`void secret sync`의 확인 프롬프트에 답할 수 있게 turbo가 가상 터미널로 실행)로 둔다.
- `--env-mode=loose`: turbo 기본(strict)은 선언하지 않은 환경 변수를 작업에 넘기지 않는다. 그러면 `VOID_TOKEN`·`VOID_PROJECT`·`CLOUDFLARE_API_TOKEN`·`HOME`(저장된 로그인 설정) 등이 빠질 수 있다. 배포 작업은 캐시하지 않아 해시 정확성 이점이 없으므로, 셸에서 직접 실행할 때와 같은 환경을 넘긴다.
- 순서: `deploy:production`은 앱 스크립트(`pnpm run env:sync && pnpm run deploy`)를 그대로 쓴다. `&&`가 동기화 실패 시 배포를 막는다.

## 대안

| 대안                                                              | 장점                          | 단점·위험                                                                                | 결정   |
| ----------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| 루트 → `turbo run <작업> --filter=web`, 순서는 앱 스크립트의 `&&` | 기존 의미 그대로, 설정이 작음 | turbo 그래프가 순서를 알지 못함                                                          | 채택   |
| turbo `dependsOn`으로 `deploy`가 `env:sync`에 의존                | 순서를 그래프로 표현          | 비밀값 변경 없는 단독 `deploy`도 매번 동기화(확인 프롬프트)를 거쳐 의미가 바뀜           | 미채택 |
| strict 모드 + `passThroughEnv` 목록                               | 넘기는 변수가 명시적          | void·wrangler·인증 저장 위치가 쓰는 변수를 모두 알아야 하고, 빠지면 인증 실패로만 드러남 | 미채택 |

## 가정·한계

- turbo의 대화형 작업은 터미널 UI(tui)에서만 입력을 받는다. 비대화형 셸·CI에서는 확인 단계에서 실패한다(ADR-0021의 의도와 같음).
- 실제 동기화·배포는 실행하지 않았다. `turbo run … --dry-run=json`으로 명령·대화형·캐시 설정만 확인했다.

## 검증

- `apps/web/test/deployment-scripts.test.ts`: 루트 스크립트 3개와 turbo 작업 설정을 확인한다. 변경 전 2개가 실패했고 변경 후 통과했다.
