import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "club_forms" ADD COLUMN "club_id" integer NOT NULL;
  ALTER TABLE "club_forms" ADD CONSTRAINT "club_forms_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "club_forms_club_idx" ON "club_forms" USING btree ("club_id");`);
}

export async function down({
	db,
	payload,
	req,
}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "club_forms" DROP CONSTRAINT "club_forms_club_id_clubs_id_fk";
  
  DROP INDEX "club_forms_club_idx";
  ALTER TABLE "club_forms" DROP COLUMN "club_id";`);
}
