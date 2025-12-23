# packages/schema AGENTS.md

이 문서는 `packages/schema`(=@jwc/schema) 패키지 작업 규칙과 구조를 설명합니다.

- 범위: Zod 기반의 공유 스키마/타입(특히 온보딩 폼)
- 상위 규칙: 저장소 루트의 `AGENTS.md`를 우선 적용

---

## Problem 1-Pager (작업 전 5–10줄)

- 배경 / 문제 / 목표 / 비목표 / 제약(서버/클라이언트 호환, 하위호환)

---

## 구조

- `src/index.ts`
  - 외부 공개 엔트리(배럴 export)
- `src/schema/onboarding.ts`
  - 온보딩 폼 Zod 스키마 + enum/라벨 매핑 + 타입 추론
  - `FormSchema`/`Form`는 하위 호환을 위해 유지
- `src/schema/shared.ts`
  - 공용 pagination/draft/datetime 스키마

---

## 코딩/설계 규칙

- “단일 진실 소스”
  - 프론트/백/배치에서 공유되어야 하는 검증 규칙은 여기로 모읍니다.
- 하위 호환
  - 외부에서 이미 사용 중인 export 이름(`FormSchema`, `Form`)은 제거/변경 전에 영향 범위를 먼저 확인합니다.
- 타입/라벨
  - enum 값(예: `DepartmentEnum`)과 라벨 매핑(`DEPARTMENT_LABELS`)은 항상 1:1로 유지합니다.

---

## 로컬 검증

- `pnpm -C packages/schema typecheck`
- `pnpm -C packages/schema lint`
