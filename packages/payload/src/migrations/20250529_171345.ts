import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "sheets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"original_filename" varchar,
  	"file_id" varchar,
  	"web_content_link" varchar,
  	"web_view_link" varchar,
  	"schema_file" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sheets_id" integer;
  CREATE INDEX IF NOT EXISTS "sheets_updated_at_idx" ON "sheets" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "sheets_created_at_idx" ON "sheets" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sheets_fk" FOREIGN KEY ("sheets_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sheets_id_idx" ON "payload_locked_documents_rels" USING btree ("sheets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sheets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sheets" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sheets_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_sheets_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "sheets_id";`)
}
