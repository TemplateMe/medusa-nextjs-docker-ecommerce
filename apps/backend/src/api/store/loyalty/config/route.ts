import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../modules/loyalty"
import LoyaltyModuleService from "../../../../modules/loyalty/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const loyaltyService: LoyaltyModuleService = req.scope.resolve(LOYALTY_MODULE)
  
  const config = await loyaltyService.getConfig()
  
  // Only return public fields and convert to numbers
  res.json({
    config: {
      redemption_rate: parseFloat(config.redemption_rate as any),
      earning_rate: parseFloat(config.earning_rate as any),
      min_points_redemption: parseInt(config.min_points_redemption as any),
      max_points_per_order: config.max_points_per_order ? parseInt(config.max_points_per_order as any) : null,
      redemption_enabled: config.redemption_enabled,
      is_active: config.is_active,
    }
  })
}
