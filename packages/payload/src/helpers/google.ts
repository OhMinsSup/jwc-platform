import { Readable } from "node:stream";
import { ExcelManager } from "@jwc/excel";
import { env } from "@jwc/payload/env";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { type drive_v3, google } from "googleapis";
import type {
	Form as PayloadForm,
	Sheet as PayloadSheet,
} from "../payload.types";
import { buildExcelFileBuffer } from "./excel";

const DEFAULT_SHEET_NAME = "청년부_연합_여름_수련회_참가자_명단";
const GOOGLE_SHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";
const FILE_MIME_TYPE =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const SELECT_FIELDS = "id, kind, name, mimeType, webViewLink, webContentLink";

const auth = new JWT({
	email: env.GOOGLE_CLIENT_EMAIL,
	key: env.GOOGLE_PRIVATE_KEY,
	scopes: [
		"https://www.googleapis.com/auth/spreadsheets",
		"https://www.googleapis.com/auth/drive",
	],
});

const drive = google.drive({ version: "v3", auth });

export type PickDeepNonNullable<T, K extends keyof T> = {
	[P in K]-?: NonNullable<T[P]>;
} & {
	[P in Exclude<keyof T, K>]?: T[P];
};

export type Permission = Pick<
	drive_v3.Schema$Permission,
	"type" | "role" | "emailAddress"
> & {
	permissionId: string;
	[key: string]: unknown;
};

/**
 * GoogleSheetBuilder는 구글 드라이브 및 구글 스프레드시트와의 연동을 Builder 패턴으로 제공합니다.
 */
export class GoogleSheetBuilder<
	Data extends Record<string, unknown> = Record<string, unknown>,
> {
	private sheetName: string = DEFAULT_SHEET_NAME;
	private docs: Data[] = [];
	private fileId?: string;
	// private targetUserEmail?: string[];

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
	 * 엑셀에 기록할 데이터를 설정합니다.
	 * @param docs 데이터 배열
	 * @returns this
	 */
	setDocs(docs: Data[]): this {
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

	// /**
	//  * 공유할 사용자 이메일을 설정합니다.
	//  * @param email 사용자 이메일
	//  * @returns this
	//  */
	// setTargetUserEmail(email: string | string[]): this {
	// 	this.targetUserEmail = Array.isArray(email) ? email : [email];
	// 	return this;
	// }

	/**
	 * 구글 스프레드시트에 데이터를 동기화합니다.
	 * @returns 생성 또는 업데이트된 GoogleSpreadsheetWorksheet
	 */
	async syncGoogleSpreadsheet() {
		const $excel = new ExcelManager();
		const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, auth);

		await doc.loadInfo();
		let sheet = doc.sheetsByTitle[this.sheetName];

		if (!sheet) {
			sheet = await doc.addSheet({
				title: this.sheetName,
				headerValues: $excel.head
					.createFormSheetHeaders()
					.filter((header) => header.name !== "순서")
					.map((header) => header.name),
			});
		}

		await sheet?.clearRows();

		const rows = $excel.rowData.generateExcelFormRows(this.docs);

		await sheet.addRows(rows);

		return sheet;
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

		const file = await drive.files.create({
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

		const file = await drive.files.update({
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
		const file = await drive.files.get({
			fileId,
			fields: SELECT_FIELDS,
		});
		return file.data ?? null;
	}

	/**
	 * 구글 드라이브 파일에 권한을 추가합니다.
	 * @param fileId 파일 ID
	 * @param targetUserEmail 사용자 이메일 (없으면 anyone만 적용)
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
				const createPermission = (
					params?: drive_v3.Params$Resource$Permissions$Create
				) =>
					drive.permissions.create(
						params
					) as PromiseLike<drive_v3.Schema$Permission>;

				const result = await createPermission({
					// @ts-expect-error 왜 발생하는 에러지?
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

export interface Form extends PayloadForm {
	[key: string]: unknown;
}

export interface Sheet extends PayloadSheet {
	[key: string]: unknown;
}

export const gapi = new GoogleSheetBuilder<Form>();
