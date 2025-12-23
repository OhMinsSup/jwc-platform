# packages/ui AGENTS.md

이 문서는 `packages/ui`(=@jwc/ui) 패키지에서 작업할 때의 규칙과 구조를 설명합니다.

- 범위: 이 파일은 UI 패키지(디자인 시스템/컴포넌트 라이브러리) 전용 가이드입니다.
- 상위 규칙: 저장소 루트의 `AGENTS.md`(공통 규칙)를 우선으로 따릅니다.

---

## Problem 1-Pager (작성 후 작업 시작)

작업 전에 아래를 5–10줄로 메모합니다.

- 배경: 왜 바꾸는가
- 문제: 지금 무엇이 불편/오류인가
- 목표: 어떤 사용자/개발자 가치를 달성하는가
- 비목표: 이번 변경에서 하지 않을 것
- 제약: Tailwind v4 토큰/기존 컴포넌트/호환성/패키지 exports

---

## 꼭 기억할 요소 (UI 작업 핵심 규칙)

- 이 패키지는 shadcn/ui 패턴 기반입니다. 새 UI가 필요하면 먼저 `src/components/shadcn/`에 있는 기존 컴포넌트를 확인합니다.
- 아이콘은 `lucide-react`만 사용합니다. 텍스트에 이모지/이모티콘을 넣지 않습니다.
- 공통 컴포넌트 우선: 새로운 UI를 만들기 전에 `src/components/shadcn/`와 `src/components/hooks/`의 기존 구현을 먼저 재사용합니다.
- 새 컴포넌트 생성 전 확인: 기존에 없는 컴포넌트가 필요하면, “정말 공통 컴포넌트로 만들지”를 먼저 사용자(요청자)에게 확인합니다.

---

## 폴더 구조 분석 (packages/ui)

### 1) 진입점과 공개 API

- 단일 진입점: `src/index.ts`
  - shadcn 컴포넌트 대부분을 `export * from "./components/shadcn/..."` 형태로 재노출합니다.
  - 훅/유틸/아이콘도 함께 재노출합니다.
- 패키지 exports map: `package.json`의 `exports`
  - ESM exports 경로가 고정되어 있으므로 파일 이동/이름 변경은 영향이 큽니다.
  - 예: `@jwc/ui/components/shadcn/button`, `@jwc/ui/lib/utils`, `@jwc/ui/globals.css`

권장 import:
- 컴포넌트: `import { Button } from "@jwc/ui"` 또는 `import { Button } from "@jwc/ui/components/shadcn/button"`
- 유틸: `import { cn } from "@jwc/ui/lib/utils"`
- 훅: `import { useToast } from "@jwc/ui/components/hooks/use-toast"`

### 2) 컴포넌트 레이어

- `src/components/shadcn/`
  - Radix UI + Tailwind 기반의 shadcn 스타일 컴포넌트 집합.
  - 공통 패턴:
    - className 병합은 반드시 `cn()` 사용 (`@jwc/ui/lib/utils`).
    - 변형/사이즈는 `class-variance-authority(cva)`로 정의.
    - 컴포넌트 슬롯은 필요 시 `@radix-ui/react-slot`의 `Slot`(예: Button의 `asChild`) 사용.
    - client 전용이면 파일 상단에 `"use client"`.
- `src/components/hooks/`
  - UI 관련 훅(예: `useIsMobile`, `useToast`).
  - 브라우저 API 접근이 있으면 훅에서만 하고, 서버 컴포넌트에 누수되지 않게 합니다.

### 3) 스타일과 토큰

- 전역 스타일: `globals.css`
  - Tailwind v4 방식으로 `@theme inline`에서 디자인 토큰을 정의합니다.
  - 색상/반경/애니메이션 등은 CSS 변수로 관리합니다.
  - 새로운 색/그림자/폰트 하드코딩은 피하고, 가능하면 기존 토큰을 확장합니다.
- Tailwind 설정: `tailwind.config.ts`
  - 대부분 토큰은 `globals.css`에 있으므로 이 파일은 content 경로/Intellisense 목적이 큽니다.

### 4) 아이콘

- 아이콘 집합: `src/components/shadcn/icons.tsx`
  - `lucide-react`의 아이콘들을 `Icons` 오브젝트로 래핑해서 제공합니다.
  - UI에서 아이콘이 필요하면 우선 `Icons.*`를 사용하고, 없으면 추가하되 이름을 의도적으로 짓습니다.

### 5) 유틸리티

- `src/lib/utils/cn.ts`
  - `cx`(CVA) + `tailwind-merge` 조합으로 className을 안전하게 합칩니다.
- `src/lib/utils/truncate.ts`
  - 문자열 축약 유틸.

---

## 변경 규칙 (Do / Don’t)

Do:
- 기존 컴포넌트/훅/유틸 재사용을 먼저 시도합니다.
- public API 변경(특히 `package.json#exports`, `src/index.ts` exports 변경)은 영향 범위를 먼저 조사합니다.
- 컴포넌트는 가능한 한 “작고 명시적”으로 유지합니다.
- 타입은 엄격하게 유지하고, `typecheck`로 확인합니다.

Don’t:
- 임의의 새 색상/폰트/그림자 토큰을 하드코딩하지 않습니다.
- 이모지 사용 금지(아이콘은 lucide).
- 파일 이동/경로 변경으로 imports/exports를 깨지 않도록 주의합니다.

---

## 새 컴포넌트 추가 절차

1) 먼저 기존 컴포넌트로 조합 가능한지 확인
- `src/components/shadcn/`에서 유사 컴포넌트 탐색
- `src/components/hooks/`에서 필요한 로직 훅이 이미 있는지 확인

2) 새 컴포넌트가 정말 필요하면
- 공통 컴포넌트로 만들지(이 패키지에 추가할지) 먼저 확인합니다.
- 추가가 승인되면:
  - `pnpm -C packages/ui ui-add`(shadcn CLI) 사용을 우선 고려
  - 필요 시 `src/index.ts`와 `package.json#exports`에 노출 정책을 맞춥니다.

---

## 로컬 검증 체크리스트

- `pnpm -C packages/ui typecheck`
- `pnpm -C packages/ui lint`
- (필요 시) `pnpm -C packages/ui format`

---

## 작업 시 주의할 영향 범위

- `src/index.ts`는 “배럴(export barrel)”이라 변경이 곧 소비측 변경으로 이어집니다.
- `package.json#exports`는 소비 앱들이 직접 import하는 경로이므로 변경 시 즉시 빌드가 깨질 수 있습니다.
- `globals.css`는 테마/토큰의 단일 진실 소스에 가깝습니다. 토큰 추가/변경은 사이드이펙트를 염두에 둡니다.
