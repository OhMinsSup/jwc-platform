import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets" ADD COLUMN "kind" varchar;
  ALTER TABLE "sheets" ADD COLUMN "mime_type" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets" DROP COLUMN IF EXISTS "kind";
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "mime_type";`)
}
