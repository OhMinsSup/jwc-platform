import { forms, formVersions, submissionKeys } from "@schema";
import { count, db, desc, eq } from "void/db";

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

export async function insertForm(
	row: typeof forms.$inferInsert,
): Promise<void> {
	await db.insert(forms).values(row);
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
