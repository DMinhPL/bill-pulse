import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bills_file_type" AS ENUM('image', 'pdf');
  CREATE TYPE "public"."enum_sample_bills_file_type" AS ENUM('image', 'pdf');
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"display_name" varchar NOT NULL,
  	"legacy_password_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"username" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "products" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"canonical_name" varchar NOT NULL,
  	"normalized_key" varchar NOT NULL,
  	"unit" varchar DEFAULT 'cÃ¡i',
  	"category" varchar DEFAULT 'HÃ ng tiÃªu dÃ¹ng',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bill_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"order" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bills_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"raw_name" varchar NOT NULL,
  	"canonical_name" varchar NOT NULL,
  	"unit" varchar DEFAULT 'cÃ¡i' NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"total_price" numeric NOT NULL,
  	"discount" numeric,
  	"category" varchar,
  	"product_id" uuid
  );
  
  CREATE TABLE "bills" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"merchant_name" varchar DEFAULT 'KhÃ´ng rÃµ cá»­a hÃ ng' NOT NULL,
  	"branch" varchar,
  	"bill_number" varchar,
  	"date" varchar NOT NULL,
  	"time" varchar,
  	"category" varchar NOT NULL,
  	"payment_method" varchar,
  	"subtotal" numeric NOT NULL,
  	"discount_total" numeric,
  	"vat" numeric,
  	"total_amount" numeric NOT NULL,
  	"confidence_notes" varchar,
  	"file_name" varchar,
  	"file_type" "enum_bills_file_type",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sample_bills_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"raw_name" varchar NOT NULL,
  	"canonical_name" varchar NOT NULL,
  	"unit" varchar DEFAULT 'cÃ¡i' NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"total_price" numeric NOT NULL,
  	"discount" numeric,
  	"category" varchar,
  	"product_id" uuid
  );
  
  CREATE TABLE "sample_bills" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"merchant_name" varchar DEFAULT 'KhÃ´ng rÃµ cá»­a hÃ ng' NOT NULL,
  	"branch" varchar,
  	"bill_number" varchar,
  	"date" varchar NOT NULL,
  	"time" varchar,
  	"category" varchar NOT NULL,
  	"payment_method" varchar,
  	"subtotal" numeric NOT NULL,
  	"discount_total" numeric,
  	"vat" numeric,
  	"total_amount" numeric NOT NULL,
  	"confidence_notes" varchar,
  	"file_name" varchar,
  	"file_type" "enum_sample_bills_file_type",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid,
  	"products_id" uuid,
  	"bill_categories_id" uuid,
  	"bills_id" uuid,
  	"sample_bills_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"model" varchar DEFAULT 'gemini-3.8-flash',
  	"scan_prompt" varchar DEFAULT 'Analyze this Vietnamese bill and return strict JSON. Categories: {{categories}}. Payment methods: {{paymentMethods}}.',
  	"inflation_prompt" varchar DEFAULT 'Analyze these VND price trends: {{items}}.',
  	"inflation_max_items" numeric DEFAULT 20,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "lookups_payment_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "lookups_units" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "lookups_item_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "lookups" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bills_items" ADD CONSTRAINT "bills_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bills_items" ADD CONSTRAINT "bills_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sample_bills_items" ADD CONSTRAINT "sample_bills_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sample_bills_items" ADD CONSTRAINT "sample_bills_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sample_bills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bill_categories_fk" FOREIGN KEY ("bill_categories_id") REFERENCES "public"."bill_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bills_fk" FOREIGN KEY ("bills_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sample_bills_fk" FOREIGN KEY ("sample_bills_id") REFERENCES "public"."sample_bills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lookups_payment_methods" ADD CONSTRAINT "lookups_payment_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lookups_units" ADD CONSTRAINT "lookups_units_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lookups_item_categories" ADD CONSTRAINT "lookups_item_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
  CREATE UNIQUE INDEX "products_normalized_key_idx" ON "products" USING btree ("normalized_key");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "bill_categories_key_idx" ON "bill_categories" USING btree ("key");
  CREATE INDEX "bill_categories_updated_at_idx" ON "bill_categories" USING btree ("updated_at");
  CREATE INDEX "bill_categories_created_at_idx" ON "bill_categories" USING btree ("created_at");
  CREATE INDEX "bills_items_order_idx" ON "bills_items" USING btree ("_order");
  CREATE INDEX "bills_items_parent_id_idx" ON "bills_items" USING btree ("_parent_id");
  CREATE INDEX "bills_items_product_idx" ON "bills_items" USING btree ("product_id");
  CREATE INDEX "bills_user_idx" ON "bills" USING btree ("user_id");
  CREATE INDEX "bills_updated_at_idx" ON "bills" USING btree ("updated_at");
  CREATE INDEX "bills_created_at_idx" ON "bills" USING btree ("created_at");
  CREATE INDEX "user_date_idx" ON "bills" USING btree ("user_id","date");
  CREATE INDEX "sample_bills_items_order_idx" ON "sample_bills_items" USING btree ("_order");
  CREATE INDEX "sample_bills_items_parent_id_idx" ON "sample_bills_items" USING btree ("_parent_id");
  CREATE INDEX "sample_bills_items_product_idx" ON "sample_bills_items" USING btree ("product_id");
  CREATE INDEX "sample_bills_updated_at_idx" ON "sample_bills" USING btree ("updated_at");
  CREATE INDEX "sample_bills_created_at_idx" ON "sample_bills" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_bill_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("bill_categories_id");
  CREATE INDEX "payload_locked_documents_rels_bills_id_idx" ON "payload_locked_documents_rels" USING btree ("bills_id");
  CREATE INDEX "payload_locked_documents_rels_sample_bills_id_idx" ON "payload_locked_documents_rels" USING btree ("sample_bills_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "lookups_payment_methods_order_idx" ON "lookups_payment_methods" USING btree ("_order");
  CREATE INDEX "lookups_payment_methods_parent_id_idx" ON "lookups_payment_methods" USING btree ("_parent_id");
  CREATE INDEX "lookups_units_order_idx" ON "lookups_units" USING btree ("_order");
  CREATE INDEX "lookups_units_parent_id_idx" ON "lookups_units" USING btree ("_parent_id");
  CREATE INDEX "lookups_item_categories_order_idx" ON "lookups_item_categories" USING btree ("_order");
  CREATE INDEX "lookups_item_categories_parent_id_idx" ON "lookups_item_categories" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "bill_categories" CASCADE;
  DROP TABLE "bills_items" CASCADE;
  DROP TABLE "bills" CASCADE;
  DROP TABLE "sample_bills_items" CASCADE;
  DROP TABLE "sample_bills" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "ai_settings" CASCADE;
  DROP TABLE "lookups_payment_methods" CASCADE;
  DROP TABLE "lookups_units" CASCADE;
  DROP TABLE "lookups_item_categories" CASCADE;
  DROP TABLE "lookups" CASCADE;
  DROP TYPE "public"."enum_bills_file_type";
  DROP TYPE "public"."enum_sample_bills_file_type";`)
}
