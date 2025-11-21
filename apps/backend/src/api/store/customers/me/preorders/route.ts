import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/customers/me/preorders
 * Retrieve all preorders for the authenticated customer
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get all orders for the customer
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters: {
      customer_id: customerId,
    },
  })

  if (!orders || orders.length === 0) {
    return res.json({ preorders: [] })
  }

  const orderIds = orders.map((order: any) => order.id)

  // Get all preorders for the customer's orders with full details
  const { data: preorders } = await query.graph({
    entity: "preorder",
    fields: [
      "*",
      "item.*",
      "item.product_variant.*",
      "item.product_variant.product.*",
    ],
    filters: {
      order_id: orderIds,
    },
  })

  res.json({
    preorders: preorders || [],
  })
}

