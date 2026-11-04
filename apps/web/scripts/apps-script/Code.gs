"use strict";
/**
 * Google Sheets → JWC 폼 서버 웹훅 (설치형 onEdit 트리거)
 *
 * 응답 시트는 "DB"이므로 운영자가 셀을 고치면 서버가 알아야 하는 변경(납입여부, 연락처)을 통지한다.
 * 일반 답변 셀은 시트가 원본이므로 서버는 D1을 바꾸지 않는다.
 *
 * 설정
 * 1. 스크립트 편집기 > 프로젝트 설정 > 스크립트 속성에 아래 2개를 추가 (코드에 비밀값을 적지 않는다)
 *    - WEBHOOK_URL    : https://<사이트>/api/webhooks/sheets
 *    - WEBHOOK_SECRET : 서버 SHEETS_WEBHOOK_SECRET 와 같은 값
 * 2. createTrigger() 를 한 번 실행해 설치형 onEdit 트리거를 등록
 *
 * 서명: x-jwc-signature = hex(HMAC-SHA256(secret, timestamp + "." + body)), x-jwc-timestamp = epoch ms
 */

var ID_HEADER = "응답 ID";

function handleEdit(e) {
	var range = e.range;
	if (
		range.getRow() === 1 ||
		range.getNumRows() !== 1 ||
		range.getNumColumns() !== 1
	) {
		return; // 헤더 수정, 여러 셀 붙여넣기는 무시 (붙여넣기는 운영자가 개별 수정)
	}
	var sheet = range.getSheet();
	var headers = sheet
		.getRange(1, 1, 1, sheet.getLastColumn())
		.getDisplayValues()[0];
	var idIndex = headers.indexOf(ID_HEADER);
	if (idIndex < 0) {
		return; // 폼 응답 시트가 아님
	}
	var id = sheet.getRange(range.getRow(), idIndex + 1).getDisplayValue();
	if (!id) {
		return;
	}
	send({
		spreadsheetId: e.source.getId(),
		sheetName: sheet.getName(),
		header: headers[range.getColumn() - 1] || "",
		id,
		// 화면에 보이는 값 그대로 (날짜가 숫자로 바뀌어 오는 문제 방지)
		value: range.getDisplayValue(),
	});
}

function send(payload) {
	var props = PropertiesService.getScriptProperties();
	var url = props.getProperty("WEBHOOK_URL");
	var secret = props.getProperty("WEBHOOK_SECRET");
	if (!(url && secret)) {
		console.error("WEBHOOK_URL / WEBHOOK_SECRET 스크립트 속성이 필요합니다");
		return;
	}
	var body = JSON.stringify(payload);
	var timestamp = String(Date.now());
	var signature = toHex(
		Utilities.computeHmacSha256Signature(
			timestamp + "." + body,
			secret,
			Utilities.Charset.UTF_8,
		),
	);
	var response = UrlFetchApp.fetch(url, {
		method: "post",
		contentType: "application/json",
		headers: { "x-jwc-timestamp": timestamp, "x-jwc-signature": signature },
		payload: body,
		muteHttpExceptions: true,
	});
	var code = response.getResponseCode();
	if (code >= 400) {
		// 값 검증 실패(422) 등은 운영자에게 셀 메모로 알린다
		console.warn(
			"webhook " + code + ": " + response.getContentText().slice(0, 300),
		);
		SpreadsheetApp.getActive().toast(
			"서버 반영 실패: " + response.getContentText().slice(0, 100),
			"JWC 폼",
			8,
		);
	}
}

function toHex(bytes) {
	return bytes
		.map((b) => {
			var v = (b < 0 ? b + 256 : b).toString(16);
			return v.length === 1 ? "0" + v : v;
		})
		.join("");
}

/** 한 번만 실행: 설치형 onEdit 트리거 등록 (UrlFetchApp 사용에는 설치형 트리거가 필요) */
function createTrigger() {
	ScriptApp.getProjectTriggers().forEach((t) => {
		if (t.getHandlerFunction() === "handleEdit") {
			ScriptApp.deleteTrigger(t);
		}
	});
	ScriptApp.newTrigger("handleEdit")
		.forSpreadsheet(SpreadsheetApp.getActive())
		.onEdit()
		.create();
}
