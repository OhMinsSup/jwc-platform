import { Readable } from "node:stream";
import { ExcelManager } from "@jwc/excel";
import { env } from "@jwc/payload/env";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { type drive_v3, google } from "googleapis";
import type { Form, Permission, PickDeepNonNullable } from "../types";
import { buildExcelFileBuffer } from "./excel";

/**
 * 구글 인증 및 API 클라이언트 관리 클래스
 */
class GoogleApiClient {
	public readonly auth: JWT;
	public readonly sheets: ReturnType<typeof google.sheets>;
	public readonly drive: ReturnType<typeof google.drive>;

	constructor() {
		this.auth = new JWT({
			email: env.GOOGLE_CLIENT_EMAIL,
			key: env.GOOGLE_PRIVATE_KEY,
			scopes: [
				"https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/drive",
			],
		});
		this.sheets = google.sheets({ version: "v4", auth: this.auth });
		this.drive = google.drive({ version: "v3", auth: this.auth });
	}
}

const apiClient = new GoogleApiClient();

const GOOGLE_SHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";
const FILE_MIME_TYPE =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const SELECT_FIELDS = "id, kind, name, mimeType, webViewLink, webContentLink";

/**
 * 구글 시트 스타일 유틸리티
 */
export const GoogleSheetStyle = {
	headerFormat: {
		backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
		horizontalAlignment: "CENTER",
		textFormat: { bold: true },
		borders: {
			top: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
			bottom: {
				style: "SOLID",
				width: 1,
				color: { red: 0, green: 0, blue: 0 },
			},
			left: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
			right: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
		},
	},
	borderFormat: {
		top: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
		bottom: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
		left: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
		right: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
		innerHorizontal: {
			style: "SOLID",
			width: 1,
			color: { red: 0, green: 0, blue: 0 },
		},
		innerVertical: {
			style: "SOLID",
			width: 1,
			color: { red: 0, green: 0, blue: 0 },
		},
	},
};

/**
 * 구글 시트 데이터 빌더 (Builder 패턴)
 * @template T 데이터 타입
 */
export class GoogleSheetBuilder<T extends Record<string, unknown>> {
	private sheetName: string = env.GOOGLE_SHEET_TITLE;
	private docs: T[] = [];
	private fileId?: string;

	/**
	 * 시트 이름을 설정합니다.
	 * @param name 시트 이름
	 * @returns this
	 */
	setSheetName(name: string): this {
		this.sheetName = name;
		return this;
	}

	/**
	 * 시트에 입력할 데이터를 설정합니다.
	 * @param docs 데이터 배열
	 * @returns this
	 */
	setDocs(docs: T[]): this {
		this.docs = docs;
		return this;
	}

	/**
	 * 구글 드라이브 파일 ID를 설정합니다.
	 * @param fileId 파일 ID
	 * @returns this
	 */
	setFileId(fileId: string): this {
		this.fileId = fileId;
		return this;
	}

	/**
	 * 시트 ID와 테이블 정보 조회
	 */
	private async getSheetMeta() {
		const res = await apiClient.sheets.spreadsheets.get({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			fields: "sheets.properties,sheets.tables",
		});
		const sheet = res.data.sheets?.find(
			(s) => s.properties?.title === this.sheetName
		);
		return {
			sheetId: sheet?.properties?.sheetId ?? null,
			table: sheet?.tables?.[0] ?? null,
		};
	}

	/**
	 * 시트가 없으면 생성, 있으면 sheetId 반환
	 */
	private async ensureSheet(): Promise<number> {
		const { sheetId } = await this.getSheetMeta();
		if (sheetId !== null) return sheetId;
		const res = await apiClient.sheets.spreadsheets.batchUpdate({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			requestBody: {
				requests: [{ addSheet: { properties: { title: this.sheetName } } }],
			},
		});
		return res.data.replies?.[0]?.addSheet?.properties?.sheetId as number;
	}

	/**
	 * 시트 데이터 및 테이블(표) 생성/업데이트
	 */
	async upsertGoogleSheetTable(): Promise<void> {
		const $excel = new ExcelManager();
		const headerValues = $excel.head.createFormGoogleSheetHeaders();
		const headers = headerValues.map((header) => header.name);
		const rowValues = $excel.rowData.generateExcelFormRows(this.docs);
		const rows = rowValues.map((row) =>
			headers.map((header) => row[header as keyof typeof row] ?? "")
		);

		// 시트 생성 또는 조회
		const { sheetId, table } = await this.getSheetMeta();
		let realSheetId = sheetId;
		if (realSheetId === null) {
			realSheetId = await this.ensureSheet();
		}

		// 데이터 클리어
		await apiClient.sheets.spreadsheets.values.clear({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			range: `${this.sheetName}`,
		});

		// 데이터 입력
		// await apiClient.sheets.spreadsheets.values.update({
		// 	spreadsheetId: env.GOOGLE_SHEET_ID,
		// 	range: `${this.sheetName}!A1`,
		// 	valueInputOption: "USER_ENTERED",
		// 	resource: {
		// 		values: [headers, ...rows],
		// 	},
		// });

		await apiClient.sheets.spreadsheets.values.update({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			range: `${this.sheetName}!A1`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [headers, ...rows],
			},
		});

		// 테이블(표) 생성 또는 업데이트
		const tableRequest = table
			? {
					updateTable: {
						table: {
							tableId: table.tableId,
							name: this.sheetName,
							range: {
								sheetId: realSheetId,
								startRowIndex: 0,
								endRowIndex: rows.length + 1,
								startColumnIndex: 0,
								endColumnIndex: headers.length,
							},
							columnProperties: headerValues.map((header, idx) => ({
								columnName: header.name,
								columnType: header.columnType,
								columnIndex: idx,
								...(header.columnType === "DROPDOWN" &&
									header.options && {
										dataValidationRule: {
											condition: {
												type: "ONE_OF_LIST",
												values: header.options.map((option) => ({
													userEnteredValue: option,
												})),
											},
										},
									}),
							})),
						},
						fields: "*",
					},
				}
			: {
					addTable: {
						table: {
							name: this.sheetName,
							range: {
								sheetId: realSheetId,
								startRowIndex: 0,
								endRowIndex: rows.length + 1,
								startColumnIndex: 0,
								endColumnIndex: headers.length,
							},
							columnProperties: headerValues.map((header, idx) => ({
								columnName: header.name,
								columnType: header.columnType,
								columnIndex: idx,
								...(header.columnType === "DROPDOWN" &&
									header.options && {
										dataValidationRule: {
											condition: {
												type: "ONE_OF_LIST",
												values: header.options.map((option) => ({
													userEnteredValue: option,
												})),
											},
										},
									}),
							})),
						},
					},
				};

		await apiClient.sheets.spreadsheets.batchUpdate({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			requestBody: { requests: [tableRequest] },
		});
	}

	async createGoogleSheetTable() {
		await this.upsertGoogleSheetTable();
	}

	// /**
	//  * 구글 시트에 표(테이블) 객체를 생성합니다.
	//  * @returns Promise<void>
	//  */
	// async createGoogleSheetTable(): Promise<void> {
	// 	const $excel = new ExcelManager();
	// 	const headerValues = $excel.head.createFormGoogleSheetHeaders();
	// 	const rowValues = $excel.rowData.generateExcelFormRows(this.docs);
	// 	const headers = headerValues.map((header) => header.name);
	// 	const rows = rowValues.map((row) =>
	// 		headers.map((header) => row[header as keyof typeof row] ?? "")
	// 	);

	// 	// 1. 데이터 입력
	// 	await apiClient.sheets.spreadsheets.values.update({
	// 		spreadsheetId: env.GOOGLE_SHEET_ID,
	// 		range: `A1:${String.fromCharCode(65 + headers.length - 1)}${rows.length + 1}`,
	// 		valueInputOption: "RAW",
	// 		requestBody: {
	// 			values: [headers, ...rows],
	// 		},
	// 	});

	// 	// 2. 시트 ID 조회
	// 	const meta = await apiClient.sheets.spreadsheets.get({
	// 		spreadsheetId: env.GOOGLE_SHEET_ID,
	// 	});
	// 	const sheet = meta.data.sheets?.find(
	// 		(s) => s.properties?.title === this.sheetName
	// 	);
	// 	if (!sheet || sheet.properties?.sheetId === undefined) {
	// 		throw new Error(`시트 "${this.sheetName}"을 찾을 수 없습니다.`);
	// 	}
	// 	const sheetId = sheet.properties.sheetId;

	// 	// 이미 테이블이 존재하는지 확인 (2024년 이후 Table API 지원)
	// 	const tableId = sheet.tables?.at(-1)?.tableId;
	// 	const tableName = tableId ? "updateTable" : "addTable";

	// 	// 3. 테이블 객체 생성 (공식 Table API)
	// 	await apiClient.sheets.spreadsheets.batchUpdate({
	// 		spreadsheetId: env.GOOGLE_SHEET_ID,
	// 		requestBody: {
	// 			requests: [
	// 				{
	// 					[tableName]: {
	// 						...(tableName === "updateTable" && tableId
	// 							? { fields: "*" }
	// 							: {}),
	// 						table: {
	// 							name: this.sheetName,
	// 							...(tableName === "updateTable" && tableId ? { tableId } : {}),
	// 							range: {
	// 								sheetId,
	// 								startRowIndex: 0,
	// 								endRowIndex: rows.length + 1,
	// 								startColumnIndex: 0,
	// 								endColumnIndex: headers.length,
	// 							},
	// 							columnProperties: headerValues.map((header, idx) => ({
	// 								columnName: header.name,
	// 								columnType: header.columnType,
	// 								columnIndex: idx,
	// 								...(header.columnType === "DROPDOWN" &&
	// 									header.options && {
	// 										dataValidationRule: {
	// 											condition: {
	// 												type: "ONE_OF_LIST",
	// 												values: header.options.map((option) => ({
	// 													userEnteredValue: option,
	// 												})),
	// 											},
	// 										},
	// 									}),
	// 							})),
	// 						},
	// 					},
	// 				},
	// 			],
	// 		},
	// 	});
	// }

	/**
	 * 구글 시트에 데이터를 입력하고 스타일을 적용합니다.
	 * @returns Promise<void>
	 */
	async syncGoogleSpreadsheet(): Promise<void> {
		const $excel = new ExcelManager();
		const headers = Array.from(
			new Set($excel.head.createFormGoogleSheetHeaders())
		);
		const rows = $excel.rowData.generateExcelFormRows(this.docs);

		const spreadsheet = new GoogleSpreadsheet(
			env.GOOGLE_SHEET_ID,
			apiClient.auth
		);
		await spreadsheet.loadInfo();

		let sheet = spreadsheet.sheetsByTitle[this.sheetName];
		let isNewSheet = false;
		if (!sheet) {
			isNewSheet = true;
			sheet = await spreadsheet.addSheet({
				title: this.sheetName,
				headerValues: headers.map((header) => header.name),
			});
		}

		await sheet.clearRows();
		if (!isNewSheet) {
			await sheet.setHeaderRow(headers.map((header) => header.name));
		}
		await sheet.addRows(rows);

		const columnCount = headers.length;
		const rowCount = rows.length + 1;

		await apiClient.sheets.spreadsheets.batchUpdate({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			requestBody: {
				requests: [
					{
						repeatCell: {
							range: {
								sheetId: sheet.sheetId,
								startRowIndex: 0,
								endRowIndex: 1,
								startColumnIndex: 0,
								endColumnIndex: columnCount,
							},
							cell: { userEnteredFormat: GoogleSheetStyle.headerFormat },
							fields:
								"userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
						},
					},
					{
						updateBorders: {
							range: {
								sheetId: sheet.sheetId,
								startRowIndex: 0,
								endRowIndex: rowCount,
								startColumnIndex: 0,
								endColumnIndex: columnCount,
							},
							...GoogleSheetStyle.borderFormat,
						},
					},
				],
			},
		});
	}

	/**
	 * 구글 드라이브에 새 시트를 생성합니다.
	 * @returns 생성된 파일 정보
	 */
	async createByGoogleDriveSheet(): Promise<{
		file: PickDeepNonNullable<
			drive_v3.Schema$File,
			"id" | "name" | "mimeType" | "webViewLink" | "webContentLink" | "kind"
		>;
	}> {
		const buffer = await buildExcelFileBuffer(this.sheetName, this.docs);
		const body = Readable.from([buffer]);

		const requestBody = {
			name: this.sheetName,
			mimeType: GOOGLE_SHEET_MIME_TYPE,
		};

		const media = {
			mimeType: FILE_MIME_TYPE,
			body,
		};

		const file = await apiClient.drive.files.create({
			requestBody,
			fields: SELECT_FIELDS,
			media,
			supportsAllDrives: true,
			supportsTeamDrives: true,
		});

		return {
			file: file.data as PickDeepNonNullable<
				drive_v3.Schema$File,
				"id" | "name" | "mimeType" | "webViewLink" | "webContentLink" | "kind"
			>,
		};
	}

	/**
	 * 구글 드라이브의 기존 시트를 업데이트합니다.
	 * @returns 업데이트된 파일 정보
	 */
	async updateByGoogleDriveSheet(): Promise<{
		file: PickDeepNonNullable<
			drive_v3.Schema$File,
			"id" | "name" | "mimeType" | "webViewLink" | "webContentLink" | "kind"
		>;
	}> {
		if (!this.fileId) throw new Error("fileId가 필요합니다.");

		const buffer = await buildExcelFileBuffer(this.sheetName, this.docs);
		const body = Readable.from([buffer]);

		const media = {
			mimeType: FILE_MIME_TYPE,
			body,
		};

		const file = await apiClient.drive.files.update({
			fileId: this.fileId,
			fields: SELECT_FIELDS,
			media,
			supportsAllDrives: true,
			supportsTeamDrives: true,
		});

		return {
			file: file.data as PickDeepNonNullable<
				drive_v3.Schema$File,
				"id" | "name" | "mimeType" | "webViewLink" | "webContentLink" | "kind"
			>,
		};
	}

	/**
	 * 구글 드라이브에서 파일 정보를 조회합니다.
	 * @param fileId 파일 ID
	 * @returns 파일 정보 또는 null
	 */
	static async getGoogleDriveSheet(
		fileId: string
	): Promise<drive_v3.Schema$File | null> {
		const file = await apiClient.drive.files.get({
			fileId,
			fields: SELECT_FIELDS,
		});
		return file.data ?? null;
	}

	/**
	 * 구글 드라이브 파일에 권한을 추가합니다.
	 * @param fileId 파일 ID
	 * @param targetUserEmails 사용자 이메일 배열 (없으면 anyone만 적용)
	 * @param anyoneRole anyone 권한 ("reader" 또는 "writer"), 없으면 anyone 권한 미적용
	 * @returns 추가된 permission id 리스트
	 */
	static async shareFile(
		fileId: string,
		targetUserEmails?: string[],
		anyoneRole?: "reader" | "writer"
	): Promise<Map<string, Permission>> {
		const permissions: Record<string, string>[] = [];
		if (Array.isArray(targetUserEmails)) {
			const uniqueEmails = Array.from(new Set(targetUserEmails));
			for (const email of uniqueEmails) {
				permissions.push({
					type: "user",
					role: "writer",
					emailAddress: email,
				});
			}
		}
		if (anyoneRole) {
			permissions.push({
				type: "anyone",
				role: anyoneRole,
			});
		}

		const map: Map<string, Permission> = new Map();
		for (const permission of permissions) {
			try {
				const result = await apiClient.drive.permissions.create({
					// @ts-expect-error
					resource: permission,
					fileId: fileId,
					fields: "id",
					sendNotificationEmail: true,
					supportsAllDrives: true,
					supportsTeamDrives: true,
				});

				const data = (result as unknown as Record<string, unknown>)
					.data as unknown as Record<string, unknown>;

				const id = data?.id as string | undefined;
				if (id && !map.has(id)) {
					map.set(id, {
						permissionId: id,
						type: permission.type,
						role: permission.role,
						emailAddress: permission.emailAddress,
					});
				}
			} catch (err) {
				console.error(err);
			}
		}

		return map;
	}
}

/**
 * Form 타입에 특화된 GoogleSheetBuilder 인스턴스
 */
export const gapi = new GoogleSheetBuilder<Form>();
