import { Migration } from '@mikro-orm/migrations';

export class Migration20251127000001 extends Migration {

  async up(): Promise<void> {
    // Remove max_discount_percentage and points_expiry_days columns
    this.addSql('ALTER TABLE "loyalty_config" DROP COLUMN IF EXISTS "max_discount_percentage";');
    this.addSql('ALTER TABLE "loyalty_config" DROP COLUMN IF EXISTS "points_expiry_days";');
  }

  async down(): Promise<void> {
    // Restore removed columns
    this.addSql('ALTER TABLE "loyalty_config" ADD COLUMN "max_discount_percentage" numeric NULL;');
    this.addSql('ALTER TABLE "loyalty_config" ADD COLUMN "points_expiry_days" numeric NULL;');
  }

}
