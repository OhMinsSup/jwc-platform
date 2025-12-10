/**
 * Google Spreadsheet → Convex 동기화 스크립트
 *
 * 스프레드시트에서 값을 수정하면 TanStack API 웹훅으로 전송하여
 * Convex 데이터베이스를 업데이트합니다.
 *
 * 설정 방법:
 * 1. WEBHOOK_URL: TanStack API 엔드포인트 URL 설정
 *    예: https://your-domain.com/api/webhook/spreadsheet
 * 2. SHEET_ID: 대상 Google Spreadsheet ID 설정
 * 3. SHEET_TITLE: 대상 시트 이름 설정
 * 4. WEBHOOK_SECRET: (선택) 웹훅 인증용 시크릿 키
 * 5. createTriggers() 함수 실행하여 트리거 등록
 */

const WEBHOOK_URL = ''; // TanStack API 엔드포인트 URL (예: https://your-domain.com/api/webhook/spreadsheet)
const SHEET_ID = '';
const SHEET_TITLE = '신청자목록';
const WEBHOOK_SECRET = ''; // 선택: 보안을 위한 시크릿 키

/** 시트 수정 시 실행되는 함수 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const spreadsheetId = e.source.getId();

  // 시트 이름 검증
  if (sheetName !== SHEET_TITLE) {
    console.log(`onEdit: Sheet name "${sheetName}" does not match "${SHEET_TITLE}". Skipping...`);
    return;
  }

  // 스프레드시트 ID 검증
  if (spreadsheetId !== SHEET_ID) {
    console.log(`onEdit: Spreadsheet ID "${spreadsheetId}" does not match "${SHEET_ID}". Skipping...`);
    return;
  }

  // 헤더 행(1행)은 수정 무시
  if (range.getRow() === 1) {
    console.log('onEdit: Header row edit. Skipping...');
    return;
  }

  // 1행(헤더)에서 전체 헤더 배열을 가져온다
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 현재 변경한 셀의 컬럼 번호에 해당하는 헤더 값을 가져온다
  const headerValue = headers[range.getColumn() - 1];

  if (!headerValue) {
    console.log('onEdit: headerValue is required. Skipping...');
    return;
  }

  // "ID" 컬럼의 인덱스 찾기 (대소문자 무관)
  const idColIdx = headers.findIndex(h => String(h).toLowerCase() === "id");

  if (idColIdx === -1) {
    console.log('onEdit: ID column not found. Skipping...');
    return;
  }

  // 현재 수정된 행에서 ID 컬럼의 값을 가져옴
  const idValue = sheet.getRange(range.getRow(), idColIdx + 1).getValue();

  if (!idValue) {
    console.log('onEdit: ID value is required. Skipping...');
    return;
  }

  const payload = {
    eventType: 'EDIT',
    spreadsheetId: spreadsheetId,
    sheetName: sheetName,
    range: range.getA1Notation(),
    row: range.getRow(),
    column: range.getColumn(),
    header: headerValue,
    id: String(idValue),
    oldValue: e.oldValue,
    newValue: e.value,
    timestamp: new Date().toISOString(),
  };

  sendWebhook(payload);
}

/** 웹훅 전송 함수 */
function sendWebhook(payload) {
  if (!WEBHOOK_URL) {
    console.error('WEBHOOK_URL is not configured');
    return;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // 시크릿 키가 설정되어 있으면 헤더에 추가
    if (WEBHOOK_SECRET) {
      headers['x-webhook-secret'] = WEBHOOK_SECRET;
    }

    const options = {
      'method': 'post',
      'headers': headers,
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    console.log('Sending webhook:', JSON.stringify(payload, null, 2));

    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const code = response.getResponseCode();

    console.log('Webhook Response code:', code);
    console.log('Webhook Response:', response.getContentText());

    if (code >= 400) {
      console.error('Webhook failed with status:', code);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

/** 트리거 생성 함수 (최초 1회 실행) */
function createTriggers() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // 새 트리거 생성
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  console.log('Edit trigger created successfully!');
}

/** 트리거 제거 함수 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  console.log('All onEdit triggers removed!');
}

/** 테스트용 함수 */
function testWebhook() {
  const testPayload = {
    eventType: 'EDIT',
    spreadsheetId: SHEET_ID,
    sheetName: SHEET_TITLE,
    range: 'K2',
    row: 2,
    column: 11,
    header: '납입여부',
    id: 'test-id-123',
    oldValue: '미납',
    newValue: '납입',
    timestamp: new Date().toISOString(),
  };

  sendWebhook(testPayload);
}
