import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bills"
      DROP CONSTRAINT "bills_user_id_users_id_fk";
    ALTER TABLE "bills"
      ADD CONSTRAINT "bills_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bills"
      DROP CONSTRAINT "bills_user_id_users_id_fk";
    ALTER TABLE "bills"
      ADD CONSTRAINT "bills_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}
