import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251126000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "loyalty_config" (
      "id" text not null,
      "earning_rate" numeric not null default 1,
      "min_order_amount" numeric not null default 0,
      "earning_enabled" boolean not null default true,
      "redemption_rate" numeric not null default 1,
      "min_points_redemption" numeric not null default 0,
      "max_points_per_order" numeric null,
      "max_discount_percentage" numeric null,
      "redemption_enabled" boolean not null default true,
      "points_expiry_days" numeric null,
      "is_active" boolean not null default true,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "loyalty_config_pkey" primary key ("id")
    );`);
    
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_config_deleted_at" ON "loyalty_config" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "loyalty_config" cascade;`);
  }

}
