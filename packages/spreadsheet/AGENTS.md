# packages/spreadsheet AGENTS.md

이 문서는 `packages/spreadsheet`(=@jwc/spreadsheet) 패키지 작업 규칙과 구조를 설명합니다.

- 범위: 스키마 기반 스프레드시트 생성(Excel) + Google Sheets 동기화
- 상위 규칙: 저장소 루트의 `AGENTS.md`를 우선 적용

---

## Problem 1-Pager (작업 전 5–10줄)

- 배경 / 문제 / 목표 / 비목표 / 제약(외부 API, 성능, 타입 안정성)

---

## 구조

- `src/index.ts`
  - 외부 공개 엔트리(타입/스키마/빌더/구글 동기화 export)
- `src/core/`
  - `interfaces.ts`: 공용 타입/인터페이스
  - `schema.ts`: `SchemaBuilder`, `ColumnBuilder`, `schemaRegistry`, `defineSchema` 등
  - `schemas.ts`: 사전 정의 스키마 및 스키마 유틸
  - `transformer.ts`: 스키마 기반 데이터 변환기
- `src/excel/`
  - `builder.ts`: ExcelJS 기반 `ExcelBuilder`, `createExcelBuffer`
- `src/google/`
  - `client.ts`: Google Sheets API 접근
  - `sync.ts`: `GoogleSheetsSyncer`, `syncToGoogleSheets`
- `src/utils/validator.ts`
  - 내부 검증 유틸(있을 경우 여기 확장)

---

## 설계 규칙

- 스키마 우선
  - Excel/Google Sheets 출력은 모두 `ISpreadsheetSchema`를 기준으로 동작해야 합니다.
- 변환 분리
  - “데이터 → 행/셀” 변환 로직은 `SchemaBasedTransformer`에 집중시킵니다.
- 외부 API
  - Google Sheets 동기화는 네트워크/권한 오류가 빈번하므로 오류 메시지는 구체적으로, 하지만 비밀값은 절대 로그에 남기지 않습니다.
- 확장 방식
  - 새 폼 타입 추가는 우선 `core/schemas.ts`(또는 별도 파일)로 추가하고, `src/index.ts`에서 공개 여부를 결정합니다.

---

## 로컬 검증

- `pnpm -C packages/spreadsheet typecheck`
- `pnpm -C packages/spreadsheet lint`
