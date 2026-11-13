# ADR-0026: Dependabot이 갱신하지 못한 전이 의존성 수정

- 상태: 채택
- 작성일: 2026-11-13

## Problem 1-Pager

- 배경: Dependabot 보안 업데이트가 두 패키지에서 `security_update_not_possible`로 실패했다.
- 문제: shadcn → ts-morph → minimatch 경로에 `@isaacs/brace-expansion@5.0.0`이 남아 있다. drizzle-kit은 `esbuild@^0.25.4`, 하위 core-utils는 `esbuild@~0.18.20`을 요구해 로그의 최소 수정 버전 `0.28.1`로 갱신할 수 없다.
- 목표: 두 패키지의 취약 버전을 lockfile에서 제거하고 기존 도구의 동작을 검증한다.
- 비목표: 전체 의존성 갱신, 다른 audit 항목 수정, Dependabot 경고 무시, 실제 DB·서비스 연결.
- 제약: 기존 Vite+ 버전과 catalog를 유지하고 공개 테스트 환경만 사용한다.

## 대안

- A: 상위 패키지를 갱신한다. 장점은 override가 필요 없다는 것이다. 단점은 변경 범위가 커질 수 있다는 것이며, 최신 drizzle-kit 0.31.11도 오래된 esbuild 범위를 요구하므로 문제가 남는다.
- B: 취약 버전 범위에만 pnpm override를 적용한다(채택). 장점은 두 패키지만 교체하고 이미 수정된 버전은 유지한다는 것이다. 단점과 위험은 esbuild의 상위 의존성이 선언한 버전 범위를 넘으므로 호환성 검증과 추후 override 제거 검토가 필요하다는 것이다.

## 결정과 영향

- `@isaacs/brace-expansion@<5.0.1`은 5.0.1로, `esbuild@<0.28.1`은 이미 워크스페이스에서 사용하는 0.28.2로 해석한다.
- `pnpm-lock.yaml`은 pnpm으로 재생성한다. 플랫폼별 esbuild 바이너리도 같은 버전으로 맞춘다.
- 호환성 가정: drizzle-kit과 core-utils가 사용하는 변환 API는 esbuild 0.28.2에서도 동작한다. 단위 테스트와 별도 임시 스키마의 SQL 생성으로 확인하며 실제 마이그레이션은 실행하지 않는다.
- 상위 패키지가 수정된 버전 범위를 채택하면 해당 override를 제거하고 lockfile을 다시 검증한다.

## 검증

- 수정 전에 lockfile 검사로 세 취약 항목(`@isaacs/brace-expansion@5.0.0`, `esbuild@0.18.20`, `esbuild@0.25.4`)이 남아 있음을 재현했다.
- 수정 후 lockfile 검사와 `pnpm audit`으로 두 패키지의 취약 항목 제거를 확인했다. 직접 의존성 버전은 바뀌지 않았다. frozen lockfile 설치도 통과했다.
- Node 24에서 포맷·린트, syncpack, knip, 타입 검사와 웹 빌드가 통과했다.
- core-utils의 동기·비동기 TypeScript 변환 및 잘못된 입력 거절, drizzle-kit의 임시 TypeScript 설정·스키마로 SQL 생성이 통과했다. 실제 DB는 사용하지 않았다.
- `pnpm verify`는 테스트 단계에서 472개 중 1개가 실패했다. `development-environment.test.ts`의 임시 앱에서 `node_modules`를 심볼릭 링크로 연결하면 dotenv 실행 래퍼가 임시 루트의 존재하지 않는 `node_modules/.pnpm/dotenv-cli@11.1.0/.../cli.js`를 찾는다. 별도 임시 앱에서도 같은 경로 오류를 재현했다. 나머지 471개 테스트는 통과했다.
- 다른 패키지(minimatch, rollup, picomatch, valibot, deepmerge)의 audit 경고는 남아 있으며 별도 작업이다.

## 참고

- [brace-expansion 보안 공지](https://github.com/isaacs/brace-expansion/security/advisories/GHSA-7h2j-956f-4vf2)
- [esbuild 보안 공지](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)
