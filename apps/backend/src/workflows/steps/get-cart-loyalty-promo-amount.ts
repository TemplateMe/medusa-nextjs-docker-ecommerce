import { PromotionDTO, CustomerDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import LoyaltyModuleService from "../../modules/loyalty/service"
import { LOYALTY_MODULE } from "../../modules/loyalty"

export type GetCartLoyaltyPromoAmountStepInput = {
  cart: {
    id: string
    customer: CustomerDTO
    promotions?: PromotionDTO[]
    total: number
  }
}

export const getCartLoyaltyPromoAmountStep = createStep(
  "get-cart-loyalty-promo-amount",
  async ({ cart }: GetCartLoyaltyPromoAmountStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService = container.resolve(
      LOYALTY_MODULE
    )
    
    // Get configuration
    const config = await loyaltyModuleService.getConfig()
    
    console.log("Loyalty Config loaded:", config)
    
    if (!config.is_active || !config.redemption_enabled) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Loyalty points redemption is currently disabled"
      )
    }
    
    // Check if customer has any loyalty points
    const loyaltyPoints = await loyaltyModuleService.getPoints(
      cart.customer.id
    )

    console.log("Customer loyalty points:", loyaltyPoints)

    if (loyaltyPoints <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer has no loyalty points"
      )
    }

    // Check minimum redemption BEFORE calculating max points
    if (loyaltyPoints < config.min_points_redemption) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `You need at least ${config.min_points_redemption} points to redeem. You have ${loyaltyPoints} points.`
      )
    }

    // Get maximum usable points based on configuration and cart total
    const maxUsablePoints = await loyaltyModuleService.getMaxUsablePoints(
      cart.customer.id,
      cart.total
    )

    console.log("Max usable points:", maxUsablePoints)

    if (maxUsablePoints <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No points can be used on this order based on current rules"
      )
    }

    // Calculate discount amount from points
    const amount = await loyaltyModuleService.calculateAmountFromPoints(
      maxUsablePoints
    )

    console.log("Discount amount calculated:", {
      maxUsablePoints,
      redemptionRate: config.redemption_rate,
      discountAmount: amount
    })

    return new StepResponse({
      amount,
      pointsUsed: maxUsablePoints
    })
  }
)

