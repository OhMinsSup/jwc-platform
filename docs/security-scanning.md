# 로컬 보안 검사

## 준비

Node 24, 저장소의 pnpm, Python 3.10 이상이 필요하다. macOS/Linux에서 저장소 루트에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm security:setup
```

`security:setup`은 Python 도구를 `.cache/security-tools`의 가상 환경에 설치한다. 전역 Python 패키지는 변경하지 않는다. 도구 버전은 `scripts/security/requirements.txt`에 고정한다.

OSV-Scanner v2도 PATH에 설치한다. macOS에서는 `brew install osv-scanner`를 사용할 수 있다. 다른 플랫폼은 [공식 설치 방법](https://google.github.io/osv-scanner/installation/)을 따른다.

## 검사 명령

```bash
pnpm security
```

audit → OSV → Semgrep CE → GuardDog를 실행한다. 한 검사가 실패해도 다음 검사를 실행한다. 계정이나 API 토큰은 필요 없다. 기본 `pnpm verify` 및 GitHub Actions에는 연결하지 않는다.

| 명령                    | 검사 범위                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm security:audit`   | lockfile의 알려진 npm 취약점                                                                    |
| `pnpm security:osv`     | lockfile을 OSV 취약점 DB와 대조                                                                 |
| `pnpm security:code`    | `apps/web/src`, `packages`, `tooling`의 소스를 Semgrep CE 공개 `p/security-audit` 규칙으로 분석 |
| `pnpm security:malware` | 현재 플랫폼에 설치된 외부 패키지의 실제 소스를 GuardDog 기본 규칙으로 분석                      |

GuardDog는 개발·전이·설치된 선택 의존성과 동일 이름의 여러 버전을 포함하고, workspace 소스나 설치 후 남은 미사용 패키지는 제외한다. pnpm의 설치 목록을 읽고 실제 package.json 버전과 lockfile을 대조한다. 미설치 선택 의존성(다른 플랫폼 전용 바이너리 포함)과 registry 메타데이터는 이 코드 검사에 포함되지 않는다.

패키지별 소스 검사는 시간이 걸리며 4개 프로세스로 병렬 실행한다. 한 패키지의 제한 시간은 3분이다. 일부 패키지를 다시 확인하려면 다음처럼 실행한다. 이 결과는 전체 검사 결과가 아니다.

```bash
pnpm security:malware --package esbuild
```

## 보고서와 실패

각 실행은 `.cache/security/reports/run-*` 디렉터리에 도구별 JSON과 stderr 로그, `summary.json`을 남긴다. GuardDog의 `malware.json`은 패키지 이름·버전과 개별 보고서 경로를 연결한다. 동시에 실행해도 보고서를 덮어쓰지 않는다.

종료 코드 0은 해당 검사 범위에서 통과했다는 뜻이다. 탐지, 도구 미설치, 시간 초과, 다운로드·분석 오류는 실패다. GuardDog가 `issues: 0`을 반환해도 `errors`가 있거나 결과 형식이 불완전하면 실패한다. GuardDog의 기본 탐지는 정상 코드의 capability도 포함하므로 악성 판정으로 단정하지 않는다. 발견 항목이나 위험 목록이 있으면 검토가 필요하다는 의미로 실패한다.

현재 남아 있는 취약점이나 코드 경고 때문에 명령이 실패할 수 있다. 경고 무시나 자동 수정은 기본 동작에 포함하지 않는다. 결과를 사람이 검토한 뒤 작은 변경으로 수정한다.

기본 스캐너에는 개발자의 인증 환경을 전달하지 않고 별도 HOME을 사용한다. 실제 `.env`나 배포 자격 증명을 검사 대상으로 넣지 않는다. Semgrep는 규칙을, audit·OSV는 취약점 데이터를 네트워크로 조회한다. Semgrep 사용량 지표는 끈다. 보고서는 코드 조각을 포함할 수 있으므로 Git에서 제외한다.

## 설치 전 보호: Socket Firewall Free

```bash
pnpm security:install
```

`sfw pnpm install --frozen-lockfile`을 실행한다. 이 명령은 스캔 보고서만 만드는 것이 아니라 의존성 설치와 허용된 설치 스크립트를 실행한다. 기본 전체 보안 검사와 분리한다. API 키 없이 공개 registry에서 확인된 악성 패키지 다운로드를 차단한다. 의심 패키지는 경고할 수 있고 미분석 버전은 통과할 수 있다. 캐시에서만 읽는 패키지를 다시 검사하는 도구는 아니다. Socket은 패키지 정보와 익명 사용량 정보를 수집한다.

## 선택 검사: Snyk

Snyk의 무인증 프로젝트 스캔은 지원되지 않는다. Snyk를 추가로 쓰려는 개발자만 아래 명령을 사용한다. 처음 실행하면 고정된 CLI를 다운로드한다.

```bash
pnpm security:snyk:auth
pnpm security:snyk
```

공식 브라우저 인증을 사용하고 토큰을 코드·명령 인수·로그에 넣지 않는다. Snyk는 기본 무인증 검사에 포함하지 않으며 자동 로그인도 수행하지 않는다.

결정과 한계는 [ADR-0027](adr/0027-local-security-scans.md)에 기록한다. 어떤 검사도 모든 취약점이나 악성 코드를 탐지한다고 보장하지 않는다.
