import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets" ADD COLUMN "kind_type" varchar;
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "kind";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets" ADD COLUMN "kind" varchar;
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "kind_type";`)
}
