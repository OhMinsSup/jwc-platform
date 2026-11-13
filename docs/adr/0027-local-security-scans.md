# ADR-0027: 인증 없는 로컬 패키지·코드 보안 검사

- 상태: 채택
- 작성일: 2026-11-13

## Problem 1-Pager

- 배경: 전이 의존성의 취약점을 수정한 뒤 개발자가 로컬에서 보안 검사를 반복할 방법이 필요하다.
- 문제: 버전 기반 audit만으로 패키지 내부의 악성 동작이나 직접 작성한 코드의 보안 패턴을 검사할 수 없다.
- 목표: 인증 없는 pnpm audit·OSV-Scanner·GuardDog·Semgrep CE 검사와 Socket Firewall Free 설치 보호를 로컬 명령으로 제공한다.
- 비목표: GitHub 설정·CI 변경, 취약 의존성 자동 수정, Snyk 인증 우회, 실제 개발용 비밀값·배포 자격 증명 접근.
- 제약: 기존 override를 유지한다. 기본 verify는 바꾸지 않는다. 검사 실패와 도구 미설치를 성공으로 처리하지 않는다.

## 대안

- A: 서비스 계정·API 토큰을 사용하는 Snyk/Socket 기본 스캔을 통합한다. 장점은 서비스 보고서이며 단점은 인증 준비가 필요하고 무인증 요구를 충족하지 못한다.
- B: 무인증 도구를 기본 명령으로 묶고 Snyk는 선택 명령으로 제공한다(채택). 장점은 개발자 계정 없이 실행할 수 있다는 것이며, 단점은 Python 도구와 OSV-Scanner 설치가 필요하고 도구별 탐지 범위가 다르다는 것이다.

## 결정과 영향

- pnpm audit·OSV는 알려진 취약점, GuardDog는 설치된 외부 패키지 소스, Semgrep CE는 앱·공용 패키지의 소스를 검사한다.
- GuardDog는 pnpm이 보고한 설치 패키지의 실제 소스를 검사하며 lockfile 버전과 대조한다. 개발·전이·현재 플랫폼의 선택 의존성과 동일 패키지의 여러 버전을 포함한다. 다른 플랫폼 전용 미설치 패키지는 audit·OSV의 lockfile 검사 범위이며 GuardDog 소스 검사의 대상은 아니다.
- GuardDog 3.2.0의 원격 패키지 검사에서 macOS/Homebrew 샌드박스 추출 오류를 확인했다. 샌드박스를 끄는 대신 이미 설치된 소스를 대상으로 스캔한다. 이 경로는 registry 메타데이터 분석을 포함하지 않는다. 설치 전 보호는 Socket으로 보완한다.
- 전체 검사에서 한 도구가 실패해도 나머지 도구를 실행하고 최종 종료 코드로 실패를 반환한다. 설치 보호는 의존성을 변경하는 작업이므로 별도 명령이다.
- 가정: 기본 규칙에서 탐지한 항목은 사람이 검토할 후보이며, 미탐·오탐과 도구의 플랫폼 제한이 있다. 도구 오류와 탐지를 구분해 확인한다.
- Semgrep와 GuardDog 버전은 requirements에 고정한다. 설치물과 보고서는 Git에서 제외하는 `.cache/` 아래에 둔다.
- Snyk는 공식 인증이 필요하므로 무인증 기본 검사에 포함하지 않는다. 계정이 있는 개발자는 별도 명령을 사용할 수 있다.
- Semgrep의 auto 설정은 지표 수집을 끄면 실행할 수 없어 공개 `p/security-audit` 규칙을 명시한다. 계정 인증과 지표 수집 없이 규칙을 내려받아 로컬에서 검사한다.

## 검증 결과 (2026-11-13)

- 새 연결 코드의 테스트 7개와 타입·포맷·린트·의존성 일관성·미사용 코드 검사가 통과했다. 테스트는 버전 중복·선택 의존성·다운로드 오류·미설치 도구·시간 초과·실패 후 계속 실행을 포함한다.
- GuardDog가 설치된 711개 패키지를 분석 오류 없이 검사했다. 346개에서 기본 탐지 항목이 나왔다. 이 중 상관 위험 목록이 있는 패키지는 55개이며, 탐지 자체는 악성 패키지 확정이 아니다. 미설치 선택 의존성 270개는 별도로 집계했다.
- pnpm audit는 기존 취약점 경고 9건(low 1, moderate 3, high 5)을 보고했고, OSV도 lockfile의 취약점을 보고했다. 경고를 무시하거나 자동 수정하지 않았다.
- Semgrep의 첫 auto 실행 오류를 명시적 공개 규칙으로 수정한 뒤 재검사했다. 소스 파일 362개에서 탐지와 분석 오류가 없었다.
- Socket 실행 파일과 `pnpm security:install --ignore-scripts`가 정상 실행됐다. 이 설치는 캐시를 사용했으므로 실제 악성 다운로드 차단을 재현한 검사는 아니다.
- 전체 테스트는 478개 중 기존 dotenv 임시 앱 경로 테스트 1개가 실패했고 477개가 통과했다. 이후 시간 초과 테스트 1개를 추가한 새 연결 코드 테스트 7개도 통과했다.
- Snyk 인증·스캔은 실행하지 않았다. 인증 없는 기본 검사 요구를 유지한다.

## 참고

- [Snyk 인증](https://docs.snyk.io/developer-tools/snyk-cli/authenticate-to-use-the-cli)
- [GuardDog](https://github.com/DataDog/guarddog)
- [Semgrep 로컬 규칙](https://docs.semgrep.dev/running-rules)
- [Socket Firewall Free](https://docs.socket.dev/docs/socket-firewall-free)
- [OSV-Scanner](https://google.github.io/osv-scanner/)
