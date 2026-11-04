# packages/form-core AGENTS.md

폼 정의(데이터) → 검증, 조건 분기, 페이지 이동, 시트 셀 코덱, 메시지 변수를 파생하는 **순수 함수** 패키지.

## 규칙

- I/O 금지: 네트워크, DB, 전역 상태, `Date.now()` 직접 호출 금지 (시각은 인자로 받는다).
- 정의 스키마 변경은 `DEFINITION_SCHEMA_VERSION` 영향과 기존 `form_versions` 데이터 호환성을 먼저 검토한다.
- 새 필드 타입 = `definition/fields.ts` 스키마 1개 + `field-types/registry.ts` 항목 1개 + 웹 렌더러 테이블 1개 + 편집기 표(`apps/web/src/form-builder/model/field-catalog.ts`, `property-specs.ts`, `conditions.ts`의 `RULE_SPEC_BY_TYPE`). 분기문을 늘리지 않는다 (누락은 타입 오류로 드러난다).
- 조건(showIf)은 앞쪽 필드만 참조한다 (무결성 검사로 강제). 순환이 원천 차단되어 단일 패스로 평가한다.
- 시스템 컬럼 헤더(`SYSTEM_COLUMNS`)는 응답 시트의 열 이름이다. 바꾸면 기존 시트에서 응답 ID/납입여부를 찾지 못한다.

## 공개 방식

- 배럴(`index.ts`) 없이 모듈별 subpath로 공개한다: `@jwc/form-core/<경로>` (예: `answers/validate`, `definition/definition`, `samples/retreat-2026`). 새 모듈은 파일을 추가하면 바로 import할 수 있다.

## 검증

- `pnpm -C packages/form-core test`
- `pnpm -C packages/form-core typecheck`
