import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { completeCartPreorderWorkflow } from "../../../../../workflows/complete-cart-preorder";

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await completeCartPreorderWorkflow(req.scope).run({
    input: {
      cart_id: id,
    }
  })

  // The workflow returns order as an array, so we need to extract the first element
  const order = Array.isArray(result.order) ? result.order[0] : result.order

  res.json({
    type: "order",
    order: order,
  })
}