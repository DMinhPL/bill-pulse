import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "invitation_codes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"consumed_at" timestamp(3) with time zone,
  	"consumed_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invitation_codes_id" uuid;
  ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_consumed_by_id_users_id_fk" FOREIGN KEY ("consumed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "invitation_codes_code_idx" ON "invitation_codes" USING btree ("code");
  CREATE INDEX "invitation_codes_consumed_by_idx" ON "invitation_codes" USING btree ("consumed_by_id");
  CREATE INDEX "invitation_codes_updated_at_idx" ON "invitation_codes" USING btree ("updated_at");
  CREATE INDEX "invitation_codes_created_at_idx" ON "invitation_codes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invitation_codes_fk" FOREIGN KEY ("invitation_codes_id") REFERENCES "public"."invitation_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_invitation_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("invitation_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invitation_codes_fk";
  DROP INDEX "payload_locked_documents_rels_invitation_codes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invitation_codes_id";`)
  await db.execute(sql`
   ALTER TABLE "invitation_codes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invitation_codes";`)
}
