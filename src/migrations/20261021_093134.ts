import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_email_idx";
  ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'cái';
  ALTER TABLE "products" ALTER COLUMN "category" SET DEFAULT 'Hàng tiêu dùng';
  ALTER TABLE "bills_items" ALTER COLUMN "unit" SET DEFAULT 'cái';
  ALTER TABLE "bills" ALTER COLUMN "merchant_name" SET DEFAULT 'Không rõ cửa hàng';
  ALTER TABLE "sample_bills_items" ALTER COLUMN "unit" SET DEFAULT 'cái';
  ALTER TABLE "sample_bills" ALTER COLUMN "merchant_name" SET DEFAULT 'Không rõ cửa hàng';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'cÃ¡i';
  ALTER TABLE "products" ALTER COLUMN "category" SET DEFAULT 'HÃ ng tiÃªu dÃ¹ng';
  ALTER TABLE "bills_items" ALTER COLUMN "unit" SET DEFAULT 'cÃ¡i';
  ALTER TABLE "bills" ALTER COLUMN "merchant_name" SET DEFAULT 'KhÃ´ng rÃµ cá»­a hÃ ng';
  ALTER TABLE "sample_bills_items" ALTER COLUMN "unit" SET DEFAULT 'cÃ¡i';
  ALTER TABLE "sample_bills" ALTER COLUMN "merchant_name" SET DEFAULT 'KhÃ´ng rÃµ cá»­a hÃ ng';
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");`)
}
