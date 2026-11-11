import { sheetTitleKey } from "@jwc/google/spreadsheet-ref";
import { forms, formVersions, submissionKeys } from "@schema";
import { count, db, desc, eq, sql } from "void/db";

import { isUniqueViolation } from "../../../platform/server/db-errors";

export type FormRow = typeof forms.$inferSelect;
export type FormVersionRow = typeof formVersions.$inferSelect;

export async function listForms() {
	return await db
		.select({
			id: forms.id,
			slug: forms.slug,
			status: forms.status,
			sheetName: forms.sheetName,
			publishedVersionId: forms.publishedVersionId,
			updatedAt: forms.updatedAt,
			draftDefinition: forms.draftDefinition,
			/** 저장소에 저장된 응답 수 (count(col)은 null을 세지 않는다) */
			submissionCount: count(submissionKeys.storedAt),
		})
		.from(forms)
		.leftJoin(submissionKeys, eq(submissionKeys.formId, forms.id))
		.groupBy(forms.id)
		.orderBy(desc(forms.updatedAt));
}

export async function listOpenForms() {
	return await db
		.select()
		.from(forms)
		.where(eq(forms.status, "open"))
		.orderBy(desc(forms.updatedAt));
}

export async function findFormById(id: string): Promise<FormRow | undefined> {
	return await db.select().from(forms).where(eq(forms.id, id)).get();
}

export async function findFormBySlug(
	slug: string,
): Promise<FormRow | undefined> {
	return await db.select().from(forms).where(eq(forms.slug, slug)).get();
}

export async function findVersion(
	id: string,
): Promise<FormVersionRow | undefined> {
	return await db
		.select()
		.from(formVersions)
		.where(eq(formVersions.id, id))
		.get();
}

export async function latestVersionNumber(formId: string): Promise<number> {
	const row = await db
		.select({ version: formVersions.version })
		.from(formVersions)
		.where(eq(formVersions.formId, formId))
		.orderBy(desc(formVersions.version))
		.get();
	return row?.version ?? 0;
}

/** 저장 결과. "taken" = 같은 주소(slug)나 탭을 다른 폼이 방금 썼음 (유니크 인덱스) */
export type FormInsert = "inserted" | "taken";

export async function insertForm(
	row: typeof forms.$inferInsert,
): Promise<FormInsert> {
	try {
		await db.insert(forms).values(row);
		return "inserted";
	} catch (error) {
		if (isUniqueViolation(error)) {
			return "taken";
		}
		throw error;
	}
}

export async function updateDraft(
	id: string,
	draftDefinition: unknown,
	now: number,
): Promise<void> {
	await db
		.update(forms)
		.set({ draftDefinition, updatedAt: now })
		.where(eq(forms.id, id));
}

export async function updateStatus(
	id: string,
	status: FormRow["status"],
	now: number,
): Promise<void> {
	await db
		.update(forms)
		.set({ status, updatedAt: now })
		.where(eq(forms.id, id));
}

/** 버전 삽입과 발행 포인터 변경을 한 번의 batch로 원자 처리 */
export async function publishVersion(
	version: typeof formVersions.$inferInsert,
	now: number,
): Promise<void> {
	await db.batch([
		db.insert(formVersions).values(version),
		db
			.update(forms)
			.set({ publishedVersionId: version.id, status: "open", updatedAt: now })
			.where(eq(forms.id, version.formId)),
	]);
}

/** 같은 탭 이름(대소문자 무시, Google 규칙)을 쓰는 폼들. 스프레드시트 비교는 서비스가 기본 ID를 채워서 한다 */
export async function listFormsBySheetName(sheetName: string) {
	return await db
		.select({
			id: forms.id,
			spreadsheetId: forms.spreadsheetId,
			sheetName: forms.sheetName,
		})
		.from(forms)
		.where(sql`lower(${forms.sheetName}) = ${sheetTitleKey(sheetName)}`);
}

/** 저장 결과. "taken" = 같은 (스프레드시트, 탭)을 다른 폼이 이미 씀 (유니크 인덱스) */
export type SheetLocationUpdate = "updated" | "taken";

export async function updateSheetLocation(
	id: string,
	location: Pick<FormRow, "spreadsheetId" | "sheetName">,
	now: number,
): Promise<SheetLocationUpdate> {
	try {
		await db
			.update(forms)
			.set({
				spreadsheetId: location.spreadsheetId,
				sheetName: location.sheetName,
				updatedAt: now,
			})
			.where(eq(forms.id, id));
		return "updated";
	} catch (error) {
		if (isUniqueViolation(error)) {
			return "taken";
		}
		throw error;
	}
}
