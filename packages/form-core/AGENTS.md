# packages/form-core AGENTS.md

폼 정의(데이터) → 검증, 조건 분기, 페이지 이동, 시트 셀 코덱, 메시지 변수를 파생하는 **순수 함수** 패키지.

## 규칙

- I/O 금지: 네트워크, DB, 전역 상태, `Date.now()` 직접 호출 금지 (시각은 인자로 받는다).
- 정의 스키마 변경은 `DEFINITION_SCHEMA_VERSION` 영향과 기존 `form_versions` 데이터 호환성을 먼저 검토한다.
- 새 필드 타입 = `definition/fields.ts` 스키마 1개 + `field-types/registry.ts` 항목 1개 + 웹 렌더러 테이블 1개 + 편집기 표(`apps/web/src/form-builder/model/field-catalog.ts`, `property-specs.ts`, `conditions.ts`의 `RULE_SPEC_BY_TYPE`). 분기문을 늘리지 않는다 (누락은 타입 오류로 드러난다).
- 조건(showIf)은 앞쪽 필드만 참조한다 (무결성 검사로 강제). 순환이 원천 차단되어 단일 패스로 평가한다.
- 시스템 컬럼 헤더(`SYSTEM_COLUMNS`)는 Apps Script와의 프로토콜이다. 바꾸면 기존 시트가 깨진다.

## 검증

- `pnpm -C packages/form-core test`
- `pnpm -C packages/form-core typecheck`
