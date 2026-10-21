import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const constraintName = 'invitation_codes_consumed_by_id_users_id_fk'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "invitation_codes"
      DROP CONSTRAINT "${sql.raw(constraintName)}";
    ALTER TABLE "invitation_codes"
      ADD CONSTRAINT "${sql.raw(constraintName)}"
      FOREIGN KEY ("consumed_by_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "invitation_codes"
      DROP CONSTRAINT "${sql.raw(constraintName)}";
    ALTER TABLE "invitation_codes"
      ADD CONSTRAINT "${sql.raw(constraintName)}"
      FOREIGN KEY ("consumed_by_id") REFERENCES "public"."users"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}
