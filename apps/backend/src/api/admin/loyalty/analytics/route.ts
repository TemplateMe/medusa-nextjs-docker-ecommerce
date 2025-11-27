import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  
  const { data: stats } = await query.graph({
    entity: "loyalty_point",
    fields: ["points"],
  })

  const totalPointsIssued = stats.reduce((sum: number, record: any) => sum + record.points, 0)
  const averagePoints = stats.length > 0 ? totalPointsIssued / stats.length : 0
  const totalCustomers = stats.length

  res.json({
    total_points_issued: totalPointsIssued,
    average_points_per_customer: Math.round(averagePoints),
    total_customers_with_points: totalCustomers,
  })
}
