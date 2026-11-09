# ADR-0020: 운영 Custom Domain 명시

- 상태: 채택
- 작성일: 2026-11-09
- 선행: ADR-0019

## Problem 1-Pager

- 배경: 사용자가 기존 Worker에 `https://veloss-todo.uk`를 연결했고 코드 반영을 요청했다.
- 문제: 도메인이 코드에 없어 Void가 기존 대시보드 설정의 안전한 재배포를 거절했다.
- 목표: 확인된 운영 도메인을 Cloudflare 배포 설정과 lock에 기록한다.
- 비목표: 원격 배포, DNS 변경, 확인되지 않은 기본 URL·미리보기 URL 활성 상태 변경.
- 제약: 실제 환경 파일·배포 자격 증명을 읽지 않고 기존 D1·큐 연결을 유지한다.

## 대안과 결정

| 대안                                         | 장점                                                                    | 단점·위험                                                                 | 결정   |
| -------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| 확인된 Custom Domain만 명시                  | 사용자 지정 도메인을 코드로 관리하고 기존 URL 공개 상태를 추측하지 않음 | Void 배포에는 `workers_dev`·`preview_urls`의 현재 상태 확인이 추가로 필요 | 채택   |
| 도메인과 두 공개 설정을 기본값으로 모두 지정 | 설정 항목을 한 번에 채움                                                | 사용 중인 주소를 끄거나 비공개 주소를 공개할 수 있음                      | 미채택 |

## 영향과 남은 정보

- `cloudflare.routes`에 `{ pattern: "veloss-todo.uk", custom_domain: true }`를 추가한다. 사용자가 적용을 요청한 앞선 제안대로 Custom Domain으로 선언한다.
- 첫 반영(라우트만) 뒤 `void deploy`가 `traffic-preservation-unavailable`로 다시 멈췄다. `@void/deploy-cloudflare` 1.6.2는 `workers_dev`·`preview_urls` 중 하나라도 설정에 없으면 기존 값을 보존하려 하고, 이전 배포 기록이 없는 기존 Worker에서는 보존할 값을 알 수 없어 거절한다.
- 사용자 결정에 따라 두 값을 명시한다.
  - `workers_dev: false`: 운영 트래픽은 Custom Domain으로만 받는다. 저장소에 `workers.dev` 주소를 쓰는 곳은 없다.
  - `preview_urls: true`: Worker에 버전 메타데이터 바인딩이 없어서 void의 배포 전 준비 확인은 Version URL에 의존한다. 끄면 준비 확인 단계에서 배포가 멈춘다.
- 대안: 두 값 모두 `true`로 두면 기존 공개 상태를 유지할 가능성이 높지만, 운영 앱이 `*.workers.dev`로도 노출된다. 그래서 채택하지 않았다.
- 공개 성능 설정으로 로컬 빌드해 생성 설정과 lock에 반영한다. 원격 Secret·Worker·도메인 설정은 변경하지 않는다.

## 검증

- 회귀 테스트(`apps/web/test/deployment-config.test.ts`)는 `routes` 누락과 공개 설정 누락에서 각각 먼저 실패했고, 설정을 추가한 뒤 통과했다.
- 환경 파일 없이 `pnpm -C apps/web build`로 빌드해 `void.lock.json`의 `source`·`resolved`에 도메인 라우트와 두 공개 설정이 기록되고 기존 D1 `web-db` 연결이 보존됨을 확인했다.
- `pnpm verify`가 통과했다(46개 파일, 테스트 328개).
- 원격 배포·도메인 동기화(`void domain`)는 실행하지 않았다.
