import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const loyaltyService = req.scope.resolve("loyalty")
  
  try {
    const config = await loyaltyService.getConfig()
    
    res.json({
      config,
    })
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to fetch loyalty configuration"
    })
  }
}
