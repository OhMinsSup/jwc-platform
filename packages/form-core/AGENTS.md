# packages/form-core AGENTS.md

폼 정의(데이터) → 검증, 조건 분기, 페이지 이동, 시트 셀 코덱, 메시지 변수를 파생하는 **순수 함수** 패키지.

## 규칙

- I/O 금지: 네트워크, DB, 전역 상태, `Date.now()` 직접 호출 금지 (시각은 인자로 받는다).
- 정의 스키마 변경은 `DEFINITION_SCHEMA_VERSION` 영향과 기존 `form_versions` 데이터 호환성을 먼저 검토한다.
- 새 필드 타입 = `definition/fields.ts` 스키마 1개 + `field-types/registry.ts` 항목 1개(응답 시트 칸 `sheet: { value, choices?, parts? }` 포함 — `parts`가 있으면 시트에서 조각 열로 나뉜다) + 저장소 열 너비 표(`@jwc/submission-store`의 `sheet-style.ts` `FIELD_WIDTHS`) + 웹 렌더러 테이블 1개 + 편집기 표(`apps/web/src/form-builder/model/field-catalog.ts`, `property-specs.ts`, `conditions.ts`의 `RULE_SPEC_BY_TYPE`). 분기문을 늘리지 않는다 (누락은 타입 오류로 드러난다).
- 조건(showIf)은 앞쪽 필드만 참조한다 (무결성 검사로 강제). 순환이 원천 차단되어 단일 패스로 평가한다.
- 운영 컬럼은 `SYSTEM_COLUMN_TABLE`의 행 하나(헤더·이전 이름·배치·조건) + `sheet/system-cells.ts`의 같은 키 항목(셀 변환)이다. 헤더를 바꿀 때는 이전 이름을 `legacyHeaders`에 남겨 기존 시트를 계속 읽게 한다 (ADR-0025).
- 셀 변환은 값 종류(`CellValueKind`)별 표 `sheet/cells.ts`의 `CELL_CODECS`가 한다 (날짜/시간 = 일련번호, number = 숫자, 나머지 = 글자). form-core는 무엇을 쓰는지만 정하고, 색·너비·서식은 저장소 어댑터의 `sheet-style.ts`가 정한다.

## 공개 방식

- 배럴(`index.ts`) 없이 모듈별 subpath로 공개한다: `@jwc/form-core/<경로>` (예: `answers/validate`, `definition/definition`, `samples/retreat-2026`). 새 모듈은 파일을 추가하면 바로 import할 수 있다.

## 검증

- `pnpm -C packages/form-core test`
- `pnpm -C packages/form-core typecheck`
