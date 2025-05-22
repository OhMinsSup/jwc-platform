import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "hashed_phone" varchar NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_hashed_phone_idx" ON "forms" USING btree ("hashed_phone");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "forms_hashed_phone_idx";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "hashed_phone";`)
}
