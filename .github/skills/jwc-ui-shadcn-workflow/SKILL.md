---
name: jwc-ui-shadcn-workflow
description: packages/ui의 shadcn(base-nova) + Base UI + Tailwind v4 컴포넌트를 추가/수정하거나 앱에서 사용할 때. 기존 컴포넌트 재사용, Base UI API 차이(render, Select items/null, onClick), exports 영향, 검증 절차를 따릅니다.
---

# UI (shadcn base-nova + Base UI) Workflow

## 언제 사용하나요?

- `packages/ui/src/components/*` 컴포넌트를 추가/수정할 때
- 앱에서 Select, Dialog, Menu, Tabs, ToggleGroup 같은 Base UI 컴포넌트를 쓸 때
- exports 경로가 깨지지 않게 변경하고 싶을 때

## 작업 원칙

- 새 컴포넌트 전에 기존 컴포넌트 재사용부터 검토
- className 조합은 `cn()`, 변형은 `cva`
- 아이콘은 `lucide-react`만 (이모지 금지)
- Base UI 차이점은 [packages/ui/AGENTS.md](../../../packages/ui/AGENTS.md)의 표를 먼저 확인 (특히 `render`, Select `items`/`null`, 메뉴 `onClick`)

## 절차

1. 변경 범위 최소화: 해당 컴포넌트/사용처만 수정
2. 새 shadcn 컴포넌트가 필요하면(요청자 확인 후): `pnpm -C packages/ui ui-add`
3. 검증
   - `pnpm -C packages/ui typecheck`
   - 사용처 앱: `pnpm -C apps/web typecheck`
   - 루트: `pnpm check`

## exports 영향

- `@jwc/ui/components/<name>` → `src/components/<name>.tsx`로 고정
- 파일 이동/이름 변경 전 `grep -rn "@jwc/ui/components/<name>" apps`로 사용처 확인

## 참고

- UI 상세 규칙: [packages/ui/AGENTS.md](../../../packages/ui/AGENTS.md)
- 공통 규칙: [AGENTS.md](../../../AGENTS.md)
