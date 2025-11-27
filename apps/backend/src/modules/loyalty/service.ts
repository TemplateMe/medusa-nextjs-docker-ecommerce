import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import LoyaltyPoint from "./models/loyalty-point"
import LoyaltyConfig from "./models/loyalty-config"
import { InferTypeOf } from "@medusajs/framework/types"

type LoyaltyPoint = InferTypeOf<typeof LoyaltyPoint>
type LoyaltyConfig = InferTypeOf<typeof LoyaltyConfig>

class LoyaltyModuleService extends MedusaService({
  LoyaltyPoint,
  LoyaltyConfig,
}) {
  async addPoints(customerId: string, points: number): Promise<LoyaltyPoint> {
    const existingPoints = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    if (existingPoints.length > 0) {
      return await this.updateLoyaltyPoints({
        id: existingPoints[0].id,
        points: existingPoints[0].points + points,
      })
    }

    return await this.createLoyaltyPoints({
      customer_id: customerId,
      points,
    })
  }

  async deductPoints(customerId: string, points: number): Promise<LoyaltyPoint> {
    const existingPoints = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    if (existingPoints.length === 0 || existingPoints[0].points < points) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Insufficient loyalty points"
      )
    }

    return await this.updateLoyaltyPoints({
      id: existingPoints[0].id,
      points: existingPoints[0].points - points,
    })
  }

  async getPoints(customerId: string): Promise<number> {
    const points = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    return points[0]?.points || 0
  }

  async calculatePointsFromAmount(amount: number): Promise<number> {
    // Get configuration
    const config = await this.getConfig()
    
    if (!config.earning_enabled) {
      return 0
    }

    // Check minimum order amount
    if (amount < config.min_order_amount) {
      return 0
    }

    // Calculate points using configured earning rate
    const points = Math.floor(amount * config.earning_rate)

    if (points < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Amount cannot be negative"
      )
    }

    return points
  }

  async calculateAmountFromPoints(points: number): Promise<number> {
    // Get configuration
    const config = await this.getConfig()
    
    if (!config.redemption_enabled) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Points redemption is currently disabled"
      )
    }

    // Check minimum redemption
    if (points < config.min_points_redemption) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Minimum ${config.min_points_redemption} points required to redeem`
      )
    }

    // Calculate amount using configured redemption rate
    return points * config.redemption_rate
  }

  async getMaxUsablePoints(customerId: string, cartTotal: number): Promise<number> {
    const config = await this.getConfig()
    const customerPoints = await this.getPoints(customerId)

    let maxPoints = customerPoints

    // Apply min points redemption - customer must have at least this many points
    if (maxPoints < config.min_points_redemption) {
      return 0 // Can't use any points if below minimum
    }

    // Apply max points per order limit
    if (config.max_points_per_order !== null && maxPoints > config.max_points_per_order) {
      maxPoints = config.max_points_per_order
    }

    // Can't use more points than cart total allows (discount can't exceed cart total)
    const maxPointsFromTotal = Math.floor(cartTotal / config.redemption_rate)
    if (maxPoints > maxPointsFromTotal) {
      maxPoints = maxPointsFromTotal
    }

    return maxPoints
  }

  async getConfig(): Promise<LoyaltyConfig> {
    const configs = await this.listLoyaltyConfigs({})
    
    if (configs.length === 0) {
      // Create default config if none exists
      return await this.createLoyaltyConfigs({
        earning_rate: 1,
        min_order_amount: 0,
        earning_enabled: true,
        redemption_rate: 1,
        min_points_redemption: 0,
        max_points_per_order: null,
        redemption_enabled: true,
        is_active: true,
      })
    }

    return configs[0]
  }

  async updateConfig(data: Partial<LoyaltyConfig>): Promise<LoyaltyConfig> {
    const config = await this.getConfig()
    return await this.updateLoyaltyConfigs({
      id: config.id,
      ...data,
    })
  }
}

export default LoyaltyModuleService
