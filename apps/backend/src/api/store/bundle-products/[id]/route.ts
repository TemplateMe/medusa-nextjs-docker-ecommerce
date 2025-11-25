import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;
  const query = req.scope.resolve("query")
  const { currency_code, region_id } = req.query

  // First, fetch bundle with basic item data AND linked products
  const { data } = await query.graph({
    entity: "bundle",
    fields: [
      "*", 
      "items.*",
      "items.product.*",
      "items.product.images.*",
      "items.product.variants.*",
      "items.product.variants.calculated_price.*",
      "product.*",
      "product.images.*",
      "product.variants.*",
      "product.variants.calculated_price.*",
    ],
    filters: {
      id
    },
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
  
  }, {
    throwIfKeyNotFound: true
  })

  const bundle = data[0]
  
  // For each item, use the first variant of the linked product
  if (bundle?.items) {
    for (const item of bundle.items) {
      if (item && item.product?.variants?.[0]) {
        (item as any).variant = item.product.variants[0]
      }
    }
  }

  res.json({
    bundle_product: bundle
  })
}