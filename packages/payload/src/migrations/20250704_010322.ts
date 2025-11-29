import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   CREATE TYPE "public"."enum_components_type" AS ENUM('text', 'select', 'richText', 'description', 'checkbox', 'radio');
  CREATE TYPE "public"."enum_club_forms_department" AS ENUM('청년1부', '청년2부', '기타');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "clubs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clubs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"components_id" integer,
  	"club_forms_id" integer
  );
  
  CREATE TABLE "components" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_components_type" NOT NULL,
  	"description" varchar,
  	"data" jsonb,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "club_forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"department" "enum_club_forms_department" NOT NULL,
  	"age_group" varchar NOT NULL,
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clubs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "components_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "club_forms_id" integer;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clubs_rels" ADD CONSTRAINT "clubs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clubs_rels" ADD CONSTRAINT "clubs_rels_components_fk" FOREIGN KEY ("components_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clubs_rels" ADD CONSTRAINT "clubs_rels_club_forms_fk" FOREIGN KEY ("club_forms_id") REFERENCES "public"."club_forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "clubs_updated_at_idx" ON "clubs" USING btree ("updated_at");
  CREATE INDEX "clubs_created_at_idx" ON "clubs" USING btree ("created_at");
  CREATE INDEX "clubs_rels_order_idx" ON "clubs_rels" USING btree ("order");
  CREATE INDEX "clubs_rels_parent_idx" ON "clubs_rels" USING btree ("parent_id");
  CREATE INDEX "clubs_rels_path_idx" ON "clubs_rels" USING btree ("path");
  CREATE INDEX "clubs_rels_components_id_idx" ON "clubs_rels" USING btree ("components_id");
  CREATE INDEX "clubs_rels_club_forms_id_idx" ON "clubs_rels" USING btree ("club_forms_id");
  CREATE INDEX "components_updated_at_idx" ON "components" USING btree ("updated_at");
  CREATE INDEX "components_created_at_idx" ON "components" USING btree ("created_at");
  CREATE INDEX "club_forms_updated_at_idx" ON "club_forms" USING btree ("updated_at");
  CREATE INDEX "club_forms_created_at_idx" ON "club_forms" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clubs_fk" FOREIGN KEY ("clubs_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_components_fk" FOREIGN KEY ("components_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_club_forms_fk" FOREIGN KEY ("club_forms_id") REFERENCES "public"."club_forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_clubs_id_idx" ON "payload_locked_documents_rels" USING btree ("clubs_id");
  CREATE INDEX "payload_locked_documents_rels_components_id_idx" ON "payload_locked_documents_rels" USING btree ("components_id");
  CREATE INDEX "payload_locked_documents_rels_club_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("club_forms_id");`);
}

export async function down({
	db,
	payload,
	req,
}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "users_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clubs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clubs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "components" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_forms" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "clubs" CASCADE;
  DROP TABLE "clubs_rels" CASCADE;
  DROP TABLE "components" CASCADE;
  DROP TABLE "club_forms" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clubs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_components_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_club_forms_fk";
  
  DROP INDEX "payload_locked_documents_rels_clubs_id_idx";
  DROP INDEX "payload_locked_documents_rels_components_id_idx";
  DROP INDEX "payload_locked_documents_rels_club_forms_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clubs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "components_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "club_forms_id";
  DROP TYPE "public"."enum_components_type";
  DROP TYPE "public"."enum_club_forms_department";`);
}
