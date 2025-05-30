import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "sheets_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "sheets" ADD COLUMN "kind" varchar;
  DO $$ BEGIN
   ALTER TABLE "sheets_permissions" ADD CONSTRAINT "sheets_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "sheets_permissions_order_idx" ON "sheets_permissions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "sheets_permissions_parent_id_idx" ON "sheets_permissions" USING btree ("_parent_id");
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "kind_type";
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "original_filename";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sheets_permissions" CASCADE;
  ALTER TABLE "sheets" ADD COLUMN "kind_type" varchar;
  ALTER TABLE "sheets" ADD COLUMN "original_filename" varchar;
  ALTER TABLE "sheets" DROP COLUMN IF EXISTS "kind";`)
}
