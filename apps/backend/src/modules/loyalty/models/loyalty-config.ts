import { model } from "@medusajs/framework/utils"

const LoyaltyConfig = model.define("loyalty_config", {
  id: model.id().primaryKey(),
  // Earning rules
  earning_rate: model.number().default(1), // Points earned per currency unit (e.g., 1 point per $1)
  min_order_amount: model.number().default(0), // Minimum order amount to earn points
  earning_enabled: model.boolean().default(true),
  
  // Redemption rules
  redemption_rate: model.number().default(1), // Currency value per point (e.g., 1 point = $1)
  min_points_redemption: model.number().default(0), // Minimum points required to redeem
  max_points_per_order: model.number().nullable(), // Maximum points that can be used per order (null = unlimited)
  redemption_enabled: model.boolean().default(true),
  
  // General settings
  is_active: model.boolean().default(true),
})

export default LoyaltyConfig
