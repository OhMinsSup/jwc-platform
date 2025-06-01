import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_forms_attendance_time" AS ENUM('AM', 'PM', 'EVENING');
  ALTER TABLE "forms" ADD COLUMN "attendance_day" varchar;
  ALTER TABLE "forms" ADD COLUMN "attendance_time" "enum_forms_attendance_time" DEFAULT 'PM';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP COLUMN IF EXISTS "attendance_day";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "attendance_time";
  DROP TYPE "public"."enum_forms_attendance_time";`)
}
