import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch";
import MeilisearchModuleService from "../../../../modules/meilisearch/service";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const meilisearchModuleService = req.scope.resolve<MeilisearchModuleService>(
    MEILISEARCH_MODULE
  )

  const { query } = req.body as { query: string }

  if (!query || typeof query !== "string") {
    return res.status(400).json({ 
      error: "Query parameter is required and must be a string" 
    })
  }

  const results = await meilisearchModuleService.search(query)

  res.json(results)
}
