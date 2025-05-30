import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets_permissions" ADD COLUMN "type" varchar;
  ALTER TABLE "sheets_permissions" ADD COLUMN "role" varchar;
  ALTER TABLE "sheets_permissions" ADD COLUMN "email_address" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets_permissions" DROP COLUMN IF EXISTS "type";
  ALTER TABLE "sheets_permissions" DROP COLUMN IF EXISTS "role";
  ALTER TABLE "sheets_permissions" DROP COLUMN IF EXISTS "email_address";`)
}
