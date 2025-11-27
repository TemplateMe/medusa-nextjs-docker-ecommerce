import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  
  // Fetch loyalty points
  const { 
    data: loyaltyPoints, 
    metadata: { count, take, skip } = {
      count: 0,
      take: 20,
      skip: 0
    },
  } = await query.graph({
    entity: "loyalty_point",
    fields: ["*"],
    pagination: {
      skip: req.queryConfig?.pagination?.skip || 0,
      take: req.queryConfig?.pagination?.take || 20,
      order: {
        updated_at: "DESC",
      },
    },
  })

  // Fetch customer details separately
  const customerIds = loyaltyPoints.map((lp: any) => lp.customer_id).filter(Boolean)
  
  const customers: any[] = []
  if (customerIds.length > 0) {
    const { data: customerData } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: {
        id: customerIds,
      },
    })
    customers.push(...customerData)
  }

  // Map customers to loyalty points
  const loyaltyPointsWithCustomers = loyaltyPoints.map((lp: any) => ({
    ...lp,
    customer: customers.find((c: any) => c.id === lp.customer_id) || null,
  }))

  res.json({ 
    loyalty_points: loyaltyPointsWithCustomers,
    count,
    limit: take,
    offset: skip,
  })
}
