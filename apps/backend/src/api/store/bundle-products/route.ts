import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")
  const { currency_code, region_id, limit = 50, offset = 0 } = req.query

  // First, fetch bundles with basic item data and linked products
  const { data, metadata } = await query.graph({
    entity: "bundle",
    fields: [
      "*", 
      "items.*",
      "items.product.*",
      "items.product.images.*",
      "items.product.variants.*",
      "items.product.variants.calculated_price.*",
      "product.*",
      "product.variants.*",
      "product.variants.calculated_price.*",
      "product.images.*",
    ],
    context: {
      items: {
        product: {
          variants: {
            calculated_price: QueryContext({
              region_id,
              currency_code,
            }),
          }
        }
      },
      product: {
        variants: {
          calculated_price: QueryContext({
            region_id,
            currency_code,
          }),
        }
      }
    },
    pagination: {
      skip: Number(offset) || 0,
      take: Number(limit) || 50,
    }
  })

  // For each bundle's items, use the first variant of the linked product
  for (const bundle of data) {
    if (bundle.items) {
      for (const item of bundle.items) {
        if (item && item.product?.variants?.[0]) {
          (item as any).variant = item.product.variants[0]
        }
      }
    }
  }

  res.json({
    bundle_products: data,
    count: metadata?.count || data.length,
    offset: Number(offset) || 0,
    limit: Number(limit) || 50,
  })
}
