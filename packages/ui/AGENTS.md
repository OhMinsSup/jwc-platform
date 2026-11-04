# packages/ui AGENTS.md

`packages/ui`(=@jwc/ui) 패키지에서 작업할 때의 규칙과 구조입니다. 저장소 루트 `AGENTS.md`(공통 규칙)를 우선으로 따릅니다.

## 기반

- shadcn/ui **base-nova** 스타일, 프리미티브는 **Base UI**(`@base-ui/react`). Radix는 쓰지 않는다.
- React 19, Tailwind v4 CSS-first (별도 `tailwind.config` 없음).
- 아이콘은 `lucide-react`만 사용합니다. 텍스트에 이모지를 넣지 않습니다.

## 구조

```text
src/
  components/   # shadcn 컴포넌트 (파일 하나 = 컴포넌트 묶음 하나, kebab-case)
  hooks/        # UI 공통 훅 (use-mobile 등)
  lib/          # cn() 등 유틸
  styles/
    globals.css # 디자인 토큰(@theme)과 전역 스타일의 단일 소스
```

## 공개 경로 (package.json `exports`)

| import                      | 파일                        |
| --------------------------- | --------------------------- |
| `@jwc/ui/components/<name>` | `src/components/<name>.tsx` |
| `@jwc/ui/hooks/<name>`      | `src/hooks/<name>.ts`       |
| `@jwc/ui/lib/<name>`        | `src/lib/<name>.ts`         |
| `@jwc/ui/globals.css`       | `src/styles/globals.css`    |

- 배럴(`@jwc/ui`) import는 없다. 항상 위 subpath로 가져온다.
- 파일 이름을 바꾸면 소비측 import가 깨진다. 바꾸기 전에 `grep -rn "@jwc/ui/components/<name>" apps`로 영향 범위를 확인한다.

## Base UI 사용 시 주의 (Radix와 다른 점)

| 주제              | Base UI                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 다른 요소로 렌더  | `asChild` 대신 `render` prop. 링크를 버튼 모양으로: `<Button nativeButton={false} render={<Link to="/" />}>`            |
| 트리거            | `<DialogTrigger render={<Button />}>열기</DialogTrigger>`                                                               |
| Select 표시값     | Root에 `items`(값→라벨)를 넘겨야 트리거에 라벨이 보인다. "선택 없음"은 `undefined`가 아니라 `null` (undefined는 비제어) |
| 콜백              | `onValueChange(value, eventDetails)`. Select는 `value`가 `null`일 수 있다                                               |
| ToggleGroup       | 값이 배열 (`value={[v]}`, `onValueChange(next: string[])`)                                                              |
| 메뉴 항목         | `onSelect`가 아니라 `onClick` (onSelect는 DOM 텍스트 선택 이벤트라 실행되지 않는다)                                     |
| 상태 속성         | `data-active`(탭), `data-pressed`(토글), `data-checked`(체크/라디오), `data-open`/`data-closed`(오버레이)               |
| AlertDialogAction | 일반 버튼이라 자동으로 닫히지 않는다. 닫기는 호출부가 상태로 처리한다 (`AlertDialogCancel`은 닫힘)                      |
| 기본 크기         | Button `h-8`, Input `h-8`, SelectTrigger `w-fit`. 꽉 채우려면 `w-full`을 준다                                           |

## 변경 규칙

- 새 UI는 먼저 `src/components/`의 기존 컴포넌트 조합으로 해결한다. 새 공통 컴포넌트가 필요하면 요청자에게 먼저 확인한다.
- 추가는 `pnpm -C packages/ui ui-add`(shadcn CLI, base-nova)로 받고, 손으로 고친 부분은 커밋 메시지에 남긴다.
- className 병합은 `cn()`, 변형은 `cva`.
- 색/반경/폰트는 `globals.css`의 토큰을 쓴다. 앱 전용 토큰(브랜드 색 등)은 앱의 `src/styles.css`에 둔다.

## 검증

- 타입: `pnpm -C packages/ui typecheck` (tsrs, 미지원 플랫폼은 tsc로 자동 폴백)
- 린트/포맷: 루트에서 `pnpm check` (패키지별 lint 스크립트는 없다)
- 생성 코드 특성상 일부 규칙은 루트 `vite.config.ts`의 `packages/ui/src/**` override에서 꺼져 있다. `ui-add`는 받은 파일에 `vp check --fix`를 실행한다.
