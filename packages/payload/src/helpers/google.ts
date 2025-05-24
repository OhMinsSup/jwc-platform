import { ExcelManager } from "@jwc/excel";
import { env } from "@jwc/payload/env";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

const SHEET_NAME = "청년부_연합_여름_수련회_참가자_명단";

const serviceAccountAuth = new JWT({
	email: env.GOOGLE_CLIENT_EMAIL,
	key: env.GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, serviceAccountAuth);

export const syncGoogleSpreadsheet = async <
	Data extends Record<string, unknown> = Record<string, unknown>,
>(
	docs: Data[]
) => {
	const $excel = new ExcelManager();

	await doc.loadInfo();
	let sheet = doc.sheetsByTitle[SHEET_NAME];

	if (!sheet) {
		sheet = await doc.addSheet({
			title: SHEET_NAME,
			headerValues: $excel.head
				.createFormSheetHeaders()
				.filter((header) => header.name !== "순서")
				.map((header) => header.name),
		});
	}

	await sheet?.clearRows();

	const rows = $excel.rowData.generateExcelFormRows(docs);

	// 3. 데이터 업로드 (row 단위로 추가)
	for (const row of rows) {
		await sheet.addRow(row);
	}

	return sheet;
};
