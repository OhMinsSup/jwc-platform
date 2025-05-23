"use server";

import { ExcelManager } from "@jwc/excel";
import { env } from "@jwc/payload/env";
import payloadConfig from "@jwc/payload/payload.config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getPayload } from "payload";

export type State = {
	readonly success: boolean;
	readonly message: string;
} | null;

const SHEET_ID = "1478n2JXYrutxmbAcopQruCBTAa3Fzm3kWhH1YWqDYfE";

const SHEET_NAME = "청년부_연합_여름_수련회_참가자_명단";

const serviceAccountAuth = new JWT({
	email: env.GOOGLE_CLIENT_EMAIL,
	key: env.GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);

export async function serverAction(_: State): Promise<NonNullable<State>> {
	try {
		const payload = await getPayload({
			config: payloadConfig,
		});

		const { docs } = await payload.find({
			collection: "forms",
			limit: 100,
		});

		if (!docs || docs.length === 0) {
			return {
				success: false,
				message: "No Existing Forms Found",
			} as const;
		}

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

		return {
			success: true,
			message: "Google Sheet Sync Success",
		};
	} catch (error) {
		console.error("Error in serverAction:", error);
		return {
			success: false,
			message: "An error occurred while processing the form.",
		} as const;
	}
}
