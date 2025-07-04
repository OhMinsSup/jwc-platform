import { log } from "@jwc/observability/log";
import { mergedDocs } from "@jwc/payload/helpers/mergedDocs";
import type { Form } from "@jwc/payload/payload.types";
import { DataConverter, GoogleSheetsSyncManager } from "@jwc/spreadsheet";
import type { CollectionAfterChangeHook } from "payload";

interface FormSchema extends Form {
	[key: string]: unknown;
}

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const { docs } = await req.payload.find({
			collection: "forms",
			limit: 100,
			sort: "-createdAt",
		});

		// 기존 문서들과 새 문서를 병합
		const mergedFormDocs = mergedDocs<FormSchema>(
			docs as FormSchema[],
			doc as FormSchema
		);

		// 데이터를 RowFormData 형식으로 변환
		const formData = mergedFormDocs.map((formDoc) =>
			DataConverter.toRowFormData(formDoc)
		);

		// Google Sheets 동기화 매니저 생성
		const syncManager = new GoogleSheetsSyncManager();

		// Google Sheets에 동기화
		await syncManager.setDocs(formData).syncToGoogleSheets();
	} catch (error) {
		log.error("collectionHooks", error as Error, {
			name: "syncGoogleSheet",
			action: "payload.collectionAfterChangeHook",
		});
	}

	return doc;
};
