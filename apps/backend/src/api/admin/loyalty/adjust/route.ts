import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"

const PostLoyaltyAdjustSchema = z.object({
  customer_id: z.string(),
  points: z.number(),
  reason: z.string().min(1, "Reason is required"),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Validate request body
    const validated = PostLoyaltyAdjustSchema.parse(req.body)
    const { customer_id, points, reason } = validated
    
    const loyaltyModuleService = req.scope.resolve("loyalty")
    
    let result
    if (points > 0) {
      result = await loyaltyModuleService.addPoints(customer_id, points)
    } else {
      result = await loyaltyModuleService.deductPoints(customer_id, Math.abs(points))
    }

    res.json({
      loyalty_point: result,
      message: `Successfully ${points > 0 ? 'added' : 'deducted'} ${Math.abs(points)} points. Reason: ${reason}`
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      })
    }
    
    res.status(400).json({
      error: error.message || "Failed to adjust loyalty points"
    })
  }
}
