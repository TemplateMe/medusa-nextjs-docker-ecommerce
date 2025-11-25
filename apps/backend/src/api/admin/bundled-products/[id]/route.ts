import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse
} from "@medusajs/framework/http";
import { 
  deleteBundledProductWorkflow,
  DeleteBundledProductWorkflowInput
} from "../../../../workflows/delete-bundled-product";
import { BUNDLED_PRODUCT_MODULE } from "../../../../modules/bundled-product";

/**
 * GET /admin/bundled-products/:id
 * Retrieve a single bundle by ID
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "bundle",
    fields: [
      "*",
      "items.*",
      "items.product.*",
      "product.*",
      "product.variants.*",
    ],
    filters: {
      id,
      deleted_at: null
    },
  }, {
    throwIfKeyNotFound: true
  })

  res.json({
    bundled_product: data[0],
  })
}

/**
 * DELETE /admin/bundled-products/:id
 * Delete a bundle
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  
  // Check if bundle exists using the module service directly
  const bundledProductModuleService = req.scope.resolve(BUNDLED_PRODUCT_MODULE)
  
  try {
    // Try to list the bundle to verify it exists
    const bundles = await bundledProductModuleService.listBundles({ id })
    
    if (!bundles || bundles.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: `Bundle with id ${id} not found`
      })
    }
  } catch (error) {
    return res.status(404).json({
      type: "not_found", 
      message: `Bundle with id ${id} not found: ${error.message}`
    })
  }

  try {
    await deleteBundledProductWorkflow(req.scope)
      .run({
        input: {
          id,
        } as DeleteBundledProductWorkflowInput
      })

    res.json({
      id,
      object: "bundled_product",
      deleted: true,
    })
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: `Failed to delete bundle: ${error.message}`
    })
  }
}
