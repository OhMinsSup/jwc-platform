# Agent Skills (Copilot / Agent Skills 표준)

이 폴더는 **Agent Skills 표준(agentskills.io)** 기반의 스킬들을 보관합니다.

- VS Code Copilot(Agent mode 포함)은 `.github/skills/` 아래의 스킬을 자동으로 탐색합니다.
- 각 스킬은 `SKILL.md`(YAML frontmatter 포함)가 있는 **디렉토리**입니다.

## VS Code에서 활성화

- (현재 프리뷰) VS Code Insiders에서 설정 `chat.useAgentSkills`를 켭니다.

## 스킬 추가 규칙(요약)

- 경로: `.github/skills/<skill-dir>/SKILL.md`
- `SKILL.md` 상단 YAML frontmatter 필수:
  - `name`: 소문자/숫자/하이픈만, 최대 64자
  - `description`: 언제 쓰는지까지 포함해 구체적으로(최대 1024자)
- 본문은 **절차/명령어/예시 중심**, 500줄 이하 권장
- 필요 시 같은 디렉토리에 `REFERENCE.md`, `examples/` 같은 보조 파일을 두고, `SKILL.md`에서 **직접 링크**합니다.
