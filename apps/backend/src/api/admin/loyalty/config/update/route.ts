import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"

const UpdateLoyaltyConfigSchema = z.object({
  earning_rate: z.number().positive().optional(),
  min_order_amount: z.number().min(0).optional(),
  earning_enabled: z.boolean().optional(),
  redemption_rate: z.number().positive().optional(),
  min_points_redemption: z.number().min(0).optional(),
  max_points_per_order: z.number().positive().nullable().optional(),
  redemption_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const loyaltyService = req.scope.resolve("loyalty")
  
  try {
    // Validate request body
    const validated = UpdateLoyaltyConfigSchema.parse(req.body)
    
    const config = await loyaltyService.updateConfig(validated)
    
    res.json({
      config,
      message: "Loyalty configuration updated successfully"
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      })
    }
    
    res.status(500).json({
      error: error.message || "Failed to update loyalty configuration"
    })
  }
}
