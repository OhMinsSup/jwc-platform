# ai-pr (GitHub Models 기반 PR 텍스트 생성)

## Problem 1-Pager

### 배경
- 이 레포는 `develop`에서 작업 후 최종적으로 `main`에 합치는 흐름을 사용한다.
- PR 작성 시 변경분 요약/리스크/테스트 포인트를 일관된 형식으로 작성하는 비용이 크다.

### 문제
- 변경된 내용을 기반으로 PR 타이틀/본문/라벨을 자동으로 생성하고 싶다.
- 특히 “왜 바뀌었는지, 영향 범위, 리스크, 테스트 포인트” 같은 상세 분석을 AI로 만들고 싶다.

### 목표
- git diff를 수집/필터링하고 GitHub Models로 요약하여:
  - PR 타이틀(컨벤션: `feat(web): ...`) 후보
  - PR 본문(정형 섹션)
  - 추천 라벨(경로 기반 + AI 보조)
  를 자동 생성한다.

### 비목표
- 이 스크립트가 자동으로 머지하거나, CI를 변경하거나, 릴리즈 노트를 생성하지 않는다.
- 라벨을 자동으로 “생성”하지 않는다(레포에 이미 존재하는 라벨을 쓰는 것을 전제).

### 제약
- 비밀값/민감정보가 LLM 입력으로 유출되면 안 된다.
- diff가 커도 모델 입력 제한을 넘지 않도록 축약/필터링해야 한다.
- 파일/함수 크기 제한(AGENTS.md)과 Biome 규칙을 준수한다.

## 대안 비교

### 대안 A: 경로 기반 룰만으로 타이틀/라벨 생성 (AI 없음)
- 장점: 안정적, 비용 0, 재현성 좋음
- 단점: 본문 품질(리스크/테스트 포인트/의도) 부족

### 대안 B: 룰(스코프/라벨) + AI(본문/타이틀 제안) 혼합 (채택)
- 장점: 일관성(룰) + 생산성/품질(AI) 밸런스
- 단점: 토큰/권한 설정 필요, 출력 검증 필요

## 사용 방법

### 0) Provider 선택
- 기본값: `github-models`
- 선택 가능 값:
  - `github-models` (GitHub Models inference)
  - `gemini-cli` (로컬에 설치된 Gemini CLI 사용)

### 1) 토큰 준비
- GitHub Models 호출에는 `models: read` 권한이 필요하다.
- 환경 변수 중 하나를 설정:
  - `GITHUB_MODELS_TOKEN` 또는 `GITHUB_TOKEN`

### 2) 실행
- 기본(base는 `origin/main` → 없으면 `main`):
  - `node tooling/scripts/ai-pr.mjs`
- base 지정:
  - `node tooling/scripts/ai-pr.mjs --base develop`
- 조직 attribution(선택):
  - `GITHUB_MODELS_ORG=YOUR_ORG node tooling/scripts/ai-pr.mjs`

#### GitHub Models provider 명시
- `node tooling/scripts/ai-pr.mjs --provider github-models`

#### Gemini CLI provider (무료 모델 사용 목적)
- 전제: `gemini` CLI가 PATH에 있고, 로컬에서 인증이 완료되어 있어야 한다.
- 실행:
  - `node tooling/scripts/ai-pr.mjs --provider gemini-cli`
- 모델 선택(선택):
  - `GEMINI_MODEL=gemini-1.5-flash node tooling/scripts/ai-pr.mjs --provider gemini-cli`

주의:
- Gemini CLI의 플래그/동작은 버전에 따라 다를 수 있다.
- 현재 구현은 `gemini -m <model> -p <prompt>` 형태를 사용한다. 설치한 CLI가 다르면 [tooling/scripts/ai-pr/providers/gemini-cli.mjs](tooling/scripts/ai-pr/providers/gemini-cli.mjs)를 조정해야 한다.

### 3) 결과물
- `.ai/pr.json`: title / body / labels
- `.ai/pr.md`: PR 본문(markdown)

### 4) (선택) gh CLI로 PR 생성/업데이트
- `gh`가 설치되어 있고 로그인되어 있으면:
  - `node tooling/scripts/ai-pr.mjs --apply`

## 보안
- `.env*` 등 민감 파일의 patch는 모델 입력에서 제외한다.
- 출력에도 토큰/시크릿을 포함하지 않는다.
