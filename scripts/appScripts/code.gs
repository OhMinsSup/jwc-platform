const WEBHOOK_URL = '';
const SHEET_ID = '';
const SHEET_TITLE = '';

/** 시트 수정 시 실행되는 함수 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();

  if (sheetName !== SHEET_TITLE) {
    console.log(`onEdit: Sheet name "${sheetName}" does not match "${SHEET_TITLE}". Skipping...`);
    return;
  }

  if (e.source.getId() !== SHEET_ID) {
    console.log(`onEdit: Spreadsheet ID "${e.source.getId()}" does not match "${SHEET_ID}". Skipping...`);
    return;
  }

  // 변경한 값의 헤더를 가져온다.
  // 1행(헤더)에서 전체 헤더 배열을 가져온다.
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 현재 변경한 셀의 컬럼 번호에 해당하는 헤더 값을 가져온다.
  const headerValue = headers[range.getColumn() - 1];
  
  // 1행(헤더)에서 "id" 컬럼의 인덱스 찾기
  const idColIdx = headers.findIndex(h => String(h).toLowerCase() === "id");
  let idValue = null;

  if (idColIdx !== -1) {
    // 현재 수정된 행(row)에서 id 컬럼의 값을 가져옴
    idValue = sheet.getRange(range.getRow(), idColIdx + 1).getValue();
  }

  const payload = {
    eventType: 'EDIT',
    spreadsheetId: e.source.getId(),
    sheetName: sheetName,
    range: range.getA1Notation(),
    row: range.getRow(),
    column: range.getColumn(),
    header: headerValue,
    id: idValue,
    oldValue: e.oldValue,
    newValue: e.value,
    timestamp: new Date().toISOString(),
  };

  sendWebhook(payload);
}

/** 웹훅 전송 함수 */
function sendWebhook(payload) {
  try {
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    console.log(payload);
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const code = response.getResponseCode()
    console.log('Webhook Response code', code)
    console.log('Webhook Response:', response.getContentText());
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

/** 트리거 생성 함수 */
function createTriggers() {
  SpreadsheetApp.get
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onEdit').forSpreadsheet(spreadsheet).onEdit().create();
  console.log('Triggers created successfully!');
}
