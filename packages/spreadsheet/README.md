# @jwc/spreadsheet

통합 스프레드시트 관리 패키지 - Excel과 Google Sheets를 하나의 API로 관리합니다.

## 특징

- 🚀 **통합 API**: Excel 생성과 Google Sheets 동기화를 하나의 인터페이스로 관리
- 📊 **타입 안전**: TypeScript로 작성되어 완전한 타입 안전성 제공
- 🎨 **스타일링**: Excel 파일에 자동 스타일 적용
- 🔄 **Builder 패턴**: 체이닝 방식으로 직관적인 API 제공
- 📋 **검증**: 데이터 무결성 검증 기능
- 🔗 **Google Sheets 연동**: 실시간 Google Sheets 동기화

## 설치

```bash
npm install @jwc/spreadsheet
# or
pnpm add @jwc/spreadsheet
# or
yarn add @jwc/spreadsheet
```

## 사용법

### 기본 사용법

```typescript
import { createSpreadsheet } from '@jwc/spreadsheet';

const data = [
  {
    name: '홍길동',
    phone: '010-1234-5678',
    gender: '남성',
    department: '청년1부',
    // ... 기타 필드
  },
  // ... 더 많은 데이터
];

// Excel과 Google Sheets 모두 사용
const result = await createSpreadsheet()
  .withData(data)
  .withExcel('신청서.xlsx', '수련회 신청서')
  .withGoogleSheetsFromEnv('수련회 신청서')
  .execute();

console.log('Excel 생성됨:', result.excel?.workbook);
console.log('Google Sheets 동기화됨:', result.google?.success);
```

### Excel만 사용

```typescript
import { createSpreadsheet } from '@jwc/spreadsheet';

const buffer = await createSpreadsheet()
  .withData(data)
  .withExcel('output.xlsx', 'Sheet1')
  .buildExcelBuffer();

// buffer를 파일로 저장하거나 HTTP 응답으로 전송
```

### Google Sheets만 사용

```typescript
import { createSpreadsheet } from '@jwc/spreadsheet';

await createSpreadsheet()
  .withData(data)
  .withGoogleSheets(
    'your-spreadsheet-id',
    'Sheet1',
    'client@email.com',
    'private-key'
  )
  .syncGoogle();
```

### 고급 사용법

```typescript
import { SpreadsheetManager } from '@jwc/spreadsheet';

const manager = new SpreadsheetManager()
  .setData(formData)
  .enableExcelExport({
    fileName: 'advanced.xlsx',
    sheetName: 'Advanced Sheet',
    enableStyling: true
  })
  .enableGoogleSync({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    sheetName: 'Advanced Sheet',
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!
  });

// 검증
const validation = manager.validate();
if (!validation.isValid) {
  console.error('검증 오류:', validation.errors);
  return;
}

// 실행
const results = await manager.executeAll();
```

## 환경 변수

Google Sheets 사용 시 다음 환경 변수가 필요합니다:

```env
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_TITLE=Sheet1
GOOGLE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## API 문서

### 주요 클래스

#### `SpreadsheetManager<T>`
메인 관리 클래스입니다.

**메서드:**
- `setData(data: T[]): this` - 데이터 설정
- `enableExcelExport(config: ExcelExportConfig): this` - Excel 내보내기 활성화
- `enableGoogleSync(config: GoogleSheetsConfig): this` - Google Sheets 동기화 활성화
- `validate(): {isValid: boolean, errors: string[]}` - 설정 검증
- `generateExcel(): Promise<Excel.Workbook>` - Excel 생성
- `exportExcelBuffer(): Promise<Buffer>` - Excel Buffer 생성
- `syncToGoogle(): Promise<void>` - Google Sheets 동기화
- `executeAll(): Promise<{excel?, google?}>` - 모든 작업 실행

#### `SpreadsheetBuilder<T>`
빌더 패턴 인터페이스입니다.

**메서드:**
- `withData(data: T[]): this` - 데이터 설정
- `withExcel(fileName, sheetName?, enableStyling?): this` - Excel 설정
- `withGoogleSheets(id, name, email, key): this` - Google Sheets 설정
- `withGoogleSheetsFromEnv(sheetName?): this` - 환경변수로 Google Sheets 설정
- `execute(): Promise<{excel?, google?}>` - 실행

### 타입 정의

#### `RowFormData`
```typescript
type RowFormData = {
  ID: string | number;
  타임스탬프: string;
  이름: string;
  또래모임: string;
  연락처: string;
  성별: string;
  부서: string;
  "단체티 사이즈"?: string;
  "픽업 가능 시간": string;
  "회비 납입 여부": string;
  "참석 형태": string;
  "참석 날짜"?: string;
  "TF팀 지원": string;
  "차량 지원 여부": string;
  "차량 지원 내용": string;
};
```

## 오류 처리

```typescript
try {
  const result = await createSpreadsheet()
    .withData(data)
    .withExcel('output.xlsx')
    .execute();
} catch (error) {
  if (error instanceof Error) {
    console.error('오류:', error.message);
  }
}
```

## 라이선스

MIT
