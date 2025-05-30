import { configurePayload } from "@jwc/payload/configurePayload";
import { GoogleSheetBuilder, gapi } from "@jwc/payload/helpers/google";
import type { drive_v3 } from "googleapis";
import { type BasePayload, getPayload } from "payload";
import type { Form, Permission, Sheet } from "../types";

/**
 * GoogleSheetSyncer는 GoogleSheetBuilder를 활용하여
 * Google Drive Sheet 동기화 및 Payload DB 연동을 Builder 패턴으로 제공합니다.
 */
export class GoogleSheetSyncer {
	private forms: Form[] = [];
	private sheet?: Sheet;
	private payload: BasePayload | null = null;

	/**
	 * 동기화할 폼 데이터를 설정합니다.
	 * @param forms 폼 데이터 배열
	 * @returns this
	 */
	setForms(forms: Form[]): this {
		this.forms = forms;
		return this;
	}

	/**
	 * 동기화할 시트 정보를 설정합니다.
	 * @param sheet 시트 정보
	 * @returns this
	 */
	setSheet(sheet?: Sheet): this {
		this.sheet = sheet;
		return this;
	}

	/**
	 * Payload 인스턴스를 설정합니다.
	 * @param payload Payload 인스턴스
	 * @returns this
	 */
	setPayload(payload: BasePayload): this {
		this.payload = payload;
		return this;
	}

	/**
	 * Google Drive Sheet를 생성 또는 업데이트하고, Payload DB에 반영합니다.
	 * @returns 생성/업데이트 결과
	 */
	async sync(mode: "drive" | "sheet" = "drive") {
		switch (mode) {
			case "drive":
				return this.syncDrive();
			case "sheet":
				return this.syncSheet();
			default:
				throw new Error("Invalid sync mode. Use 'drive' or 'sheet'.");
		}
	}

	async syncSheet() {
		const builder = gapi.setDocs(this.forms);
		// await builder.syncGoogleSpreadsheet();
		await builder.createGoogleSheetTable();
	}

	async syncDrive() {
		await this.getPayload();

		let file: drive_v3.Schema$File | undefined;
		let created = false;

		if (this.sheet?.fileId) {
			// 기존 시트가 있으면 업데이트
			const builder = gapi.setDocs(this.forms).setFileId(this.sheet.fileId);
			const data = await builder.updateByGoogleDriveSheet();
			await this.updateSheet(this.sheet.fileId, data.file);
			file = data.file;
		} else {
			// 없으면 새로 생성
			const builder = gapi.setDocs(this.forms);
			const data = await builder.createByGoogleDriveSheet();
			const map = await GoogleSheetBuilder.shareFile(data.file.id, []);
			const permissions = Array.from(map.values());
			await this.createSheet(data.file, Array.from(permissions.values()));
			file = data.file;
			created = true;
		}
	}

	private async getPayload(): Promise<BasePayload> {
		if (!this.payload) {
			this.payload = await getPayload({
				config: configurePayload(),
			});
		}
		return this.payload;
	}

	/**
	 * Payload DB에 시트 정보를 생성합니다.
	 * @param file 구글 드라이브 파일 정보
	 */
	private async createSheet(
		file: drive_v3.Schema$File | undefined,
		permissions: Permission[] = []
	) {
		const payload = await this.getPayload();

		await payload.create({
			collection: "sheets",
			data: {
				fileId: file?.id,
				kind: file?.kind,
				name: file?.name,
				mimeType: file?.mimeType,
				originalFilename: file?.originalFilename,
				webContentLink: file?.webContentLink,
				webViewLink: file?.webViewLink,
				schemaFile: file,
				permissions,
			},
		});
	}

	/**
	 * Payload DB의 시트 정보를 업데이트합니다.
	 * @param fileId 파일 ID
	 * @param file 구글 드라이브 파일 정보
	 */
	private async updateSheet(
		fileId: string,
		file: drive_v3.Schema$File | undefined,
		permissions: Permission[] = []
	) {
		const payload = await this.getPayload();

		await payload.update({
			collection: "sheets",
			where: {
				fileId: {
					equals: fileId,
				},
			},
			data: {
				fileId: file?.id,
				kind: file?.kind,
				name: file?.name,
				mimeType: file?.mimeType,
				originalFilename: file?.originalFilename,
				webContentLink: file?.webContentLink,
				webViewLink: file?.webViewLink,
				schemaFile: file,
				// permissions,
			},
		});
	}

	/**
	 * 최신 시트 목록을 조회합니다.
	 * @returns Sheet 배열
	 */
	static async getSheets(basePayload?: BasePayload): Promise<Sheet[]> {
		const payload =
			basePayload ??
			(await getPayload({
				config: configurePayload(),
			}));

		const { docs: sheets } = await payload.find({
			collection: "sheets",
			limit: 1,
			sort: "-createdAt",
		});
		return (sheets ?? []) as Sheet[];
	}

	/**
	 * 폼 데이터를 조회합니다.
	 * @returns Form 배열
	 */
	static async getForms(basePayload?: BasePayload): Promise<Form[]> {
		const payload =
			basePayload ??
			(await getPayload({
				config: configurePayload(),
			}));

		const { docs: forms } = await payload.find({
			collection: "forms",
			limit: 100,
		});

		return (forms ?? []) as Form[];
	}

	/**
	 * 파일 ID로 시트 정보를 조회합니다.
	 * @param fileId 파일 ID
	 * @returns Sheet 또는 undefined
	 */
	static async getSheet(
		fileId: string,
		basePayload?: BasePayload
	): Promise<Sheet | undefined> {
		const payload =
			basePayload ??
			(await getPayload({
				config: configurePayload(),
			}));

		const { docs: sheets } = await payload.find({
			collection: "sheets",
			where: {
				fileId: {
					equals: fileId,
				},
			},
			sort: "-createdAt",
			limit: 1,
		});

		return sheets.at(-1) as Sheet | undefined;
	}
}
