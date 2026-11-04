import { integer, sqliteTable, text, uniqueIndex } from "void/schema-d1";

/**
 * 폼 구성 데이터는 DB(D1)에 둔다.
 * - forms: 편집 중인 초안(draft)과 현재 발행 버전 포인터
 * - form_versions: 발행된 정의 스냅샷 (불변)
 */
export const forms = sqliteTable("forms", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	/** draft | open | closed */
	status: text("status", { enum: ["draft", "open", "closed"] })
		.notNull()
		.default("draft"),
	/** 편집 중인 정의 JSON (검증 전일 수 있음) */
	draftDefinition: text("draft_definition", { mode: "json" }).notNull(),
	publishedVersionId: text("published_version_id"),
	/** 응답이 저장되는 시트 탭 이름 */
	sheetName: text("sheet_name").notNull().unique(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const formVersions = sqliteTable(
	"form_versions",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		/** 검증을 통과한 FormDefinition JSON. 발행 후 절대 수정하지 않는다. */
		definition: text("definition", { mode: "json" }).notNull(),
		publishedAt: integer("published_at").notNull(),
		publishedBy: text("published_by").notNull(),
	},
	(table) => [
		uniqueIndex("form_versions_form_version_uq").on(
			table.formId,
			table.version,
		),
	],
);
