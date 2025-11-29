# @jwc/spreadsheet

스프레드시트 생성 및 관리를 위한 패키지입니다. Excel 파일 생성과 Google Sheets 동기화 기능을 제공합니다.

## 특징

- 🎯 **스키마 기반 접근**: 선언적 스키마로 스프레드시트 구조 정의
- 🔒 **타입 안전**: 제네릭을 활용한 완전한 타입 지원
- 🔌 **확장성**: 새로운 폼 타입 추가가 쉬움
- ♻️ **재사용성**: 스키마와 변환 로직 분리
- 📊 **듀얼 출력**: Excel 파일과 Google Sheets 동시 지원

## 설치

```bash
pnpm add @jwc/spreadsheet
```

## 빠른 시작

```typescript
import { createExcelBuffer, clubFormSchema } from "@jwc/spreadsheet";

// 미리 정의된 스키마로 Excel 생성
const buffer = await createExcelBuffer(clubFormSchema, data);
```

## 사용법

### 1. 미리 정의된 스키마 사용

```typescript
import { 
  createExcelBuffer, 
  retreatFormSchema,  // 수련회 신청서
  clubFormSchema      // 동아리 신청서
} from "@jwc/spreadsheet";

// Excel 파일 생성
const retreatExcel = await createExcelBuffer(retreatFormSchema, retreatData);
const clubExcel = await createExcelBuffer(clubFormSchema, clubData);
```

### 2. 커스텀 스키마 정의

```typescript
import { SchemaBuilder } from "@jwc/spreadsheet";

interface UserData {
  name: string;
  email: string;
  phone: string;
  department: string;
  joinDate: string;
}

const userSchema = SchemaBuilder.create<UserData>("users")
  .column("name", "이름").width(12).required()
  .column("email", "이메일").width(25)
  .column("phone", "전화번호").width(15)
  .column("department", "부서")
    .type("dropdown")
    .options(["개발팀", "디자인팀", "기획팀"])
    .width(12)
  .column("joinDate", "입사일").type("date").width(12)
  .defaultSheetName("사용자")
  .build();

const buffer = await createExcelBuffer(userSchema, userData);
```

### 3. Excel 빌더 사용

세밀한 제어가 필요한 경우 Excel 빌더를 직접 사용할 수 있습니다.

```typescript
import { createExcelBuilder, ExcelBuilder } from "@jwc/spreadsheet";

// 팩토리 함수 사용
const builder = createExcelBuilder(mySchema);

// 체이닝으로 Excel 생성
const buffer = await builder
  .createSheet("시트1")   // 시트 생성
  .addHeaders()           // 헤더 추가
  .addRows(data)          // 데이터 추가
  .toBuffer();            // Buffer로 변환

// 파일로 저장
await builder.toFile("./output.xlsx");

// 워크북 직접 접근
const workbook = builder.getWorkbook();
```

### 4. Google Sheets 동기화

```typescript
import { syncToGoogleSheets, createGoogleSheetsSyncer } from "@jwc/spreadsheet";

// 간단한 동기화
const result = await syncToGoogleSheets(mySchema, data, {
  spreadsheetId: "your-spreadsheet-id",
  sheetName: "시트1",
});

// 또는 Syncer 사용
const syncer = createGoogleSheetsSyncer({
  spreadsheetId: "your-spreadsheet-id",
});

const result = await syncer
  .withSchema(mySchema)
  .withData(data)
  .withSheetName("사용자목록")
  .sync();

console.log(result); // { success: true, rowCount: 100, sheetId: 123 }
```

### 5. 스키마 확장

기존 스키마를 확장하여 새로운 스키마를 만들 수 있습니다.

```typescript
import { extendSchema, pickColumns, omitColumns, clubFormSchema } from "@jwc/spreadsheet";

// 컬럼 추가
const extendedSchema = extendSchema(
  clubFormSchema,
  [
    { key: "extraField", header: "추가필드", width: 15 },
    { key: "note", header: "비고", width: 30 },
  ],
  { name: "extendedClubForm" }
);

// 특정 컬럼만 선택
const simpleSchema = pickColumns(clubFormSchema, ["name", "phone", "club"]);

// 특정 컬럼 제외
const minimalSchema = omitColumns(clubFormSchema, ["attendance", "payed"]);
```

### 6. 데이터 변환기

스키마 기반으로 데이터를 변환합니다.

```typescript
import { SchemaBasedTransformer } from "@jwc/spreadsheet";

const transformer = new SchemaBasedTransformer(mySchema);

// 단일 데이터 변환
const row = transformer.transform(data);

// 배열 변환
const rows = transformer.transformMany(dataArray);

// 헤더 목록
const headers = transformer.getHeaders();

// 2D 배열로 변환 (Google Sheets용)
const values = transformer.toRows(dataArray);
```

### 7. 스키마 레지스트리

여러 스키마를 중앙에서 관리할 수 있습니다.

```typescript
import { schemaRegistry, defineSchema } from "@jwc/spreadsheet";

// 스키마 등록
schemaRegistry.register(mySchema);

// 이름으로 조회
const schema = schemaRegistry.get("customForm");

// 존재 여부 확인
if (schemaRegistry.has("customForm")) {
  // ...
}

// 등록된 모든 스키마 이름
const names = schemaRegistry.list();
```

## API 레퍼런스

### 타입

```typescript
// 컬럼 타입
type ColumnType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "dropdown"
  | "currency"
  | "percent";

// 컬럼 정의
interface IColumnDefinition<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  type?: ColumnType;
  options?: string[];  // dropdown일 때
  formatter?: (value: unknown, row: T) => string;
  align?: "left" | "center" | "right";
  required?: boolean;
}

// 스키마 정의
interface ISpreadsheetSchema<T> {
  name: string;
  description?: string;
  columns: IColumnDefinition<T>[];
  defaultSheetName?: string;
}
```

### 주요 함수

| 함수 | 설명 |
|------|------|
| `createExcelBuffer(schema, data)` | 스키마와 데이터로 Excel Buffer 생성 |
| `createExcelBuilder(schema)` | Excel 빌더 인스턴스 생성 |
| `syncToGoogleSheets(schema, data, config)` | Google Sheets에 데이터 동기화 |
| `createGoogleSheetsSyncer(config)` | Google Sheets Syncer 인스턴스 생성 |
| `SchemaBuilder.create(name)` | 스키마 빌더 시작 |
| `extendSchema(base, columns, options)` | 스키마 확장 |
| `pickColumns(schema, keys)` | 특정 컬럼만 선택 |
| `omitColumns(schema, keys)` | 특정 컬럼 제외 |

## 환경 변수

Google Sheets 사용 시 다음 환경 변수가 필요합니다:

```env
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_SHEET_TITLE=Sheet1
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 라이선스

MIT
