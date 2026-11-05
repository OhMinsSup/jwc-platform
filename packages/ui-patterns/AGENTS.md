# packages/ui-patterns AGENTS.md

@jwc/ui(shadcn base-nova) 위에 만든 재사용 UI 패턴: 페이지 머리, 요약 수치, 빈 상태, 상태 배지, 세그먼트 선택, 복사 버튼, 검색 입력, 가운데 안내, 폼 행/입력/섹션, 선택 컨트롤, 확인 대화상자, 라이브 영역, 안내 상자, 날짜/시각 선택기. 의미 색 토큰(brand/success/warning)은 ./styles.css.

저장소 루트 `AGENTS.md`(공통 규칙)와 `docs/adr/0007`(패키지 경계)을 우선으로 따른다.

## 규칙

- 앱(`apps/*`)을 import하지 않는다 (린트로 강제).
- `@jwc/ui`(shadcn 생성 코드)를 조합한 패턴만 둔다. `@jwc/ui` 파일은 여기서 고치지 않는다.
- 도메인 개념(폼 상태, 응답)을 넣지 않는다. 상태 → 색처럼 의미가 있는 매핑은 쓰는 쪽이 표로 넘긴다 (예: `StatusBadge`에 클래스 전달).
- 의미 색 토큰(brand/success/warning)과 Tailwind 스캔 경로는 `./styles.css`. 앱은 `@jwc/ui/globals.css` 다음에 import한다.
- 접근성: 라벨, 색만으로 구분하지 않기(점+글자), 키보드 조작, `aria-live` 영역.

## 확장

새 패턴은 `src/components/<이름>.tsx` 한 파일(subpath export `./components/*`)로 추가한다. 두 화면 이상에서 쓰일 때만 옮긴다.

## 검증

- `pnpm -C packages/ui-patterns typecheck`
- `pnpm -C packages/ui-patterns test`: 순수 함수(`test/*.test.ts`)와 동작이 있는 컴포넌트(`test/*.test.tsx`, jsdom + Testing Library)
- 컴포넌트 테스트는 역할/이름으로 찾는다(`getByRole`). 접근 가능한 이름이 곧 테스트 선택자다
- Base UI 팝오버/선택은 초점을 다음 프레임에 옮긴다: 고정 대기 대신 `waitFor`로 초점 도착을 기다린다. Select는 jsdom에서 키보드(↓)로 연다
