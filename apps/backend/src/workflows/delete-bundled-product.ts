import { createWorkflow, transform, WorkflowResponse, createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { deleteBundleStep } from "./steps/delete-bundle"
import { deleteBundleItemsStep } from "./steps/delete-bundle-items"
import { deleteProductsWorkflow, dismissRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { BUNDLED_PRODUCT_MODULE } from "../modules/bundled-product"
import BundledProductModuleService from "../modules/bundled-product/service"
import { Modules } from "@medusajs/framework/utils"

export type DeleteBundledProductWorkflowInput = {
  id: string
}

// Step to fetch bundle data BEFORE any deletion (to avoid relationship loading issues)
const fetchBundleDataStep = createStep(
  "fetch-bundle-data",
  async ({ id }: { id: string }, { container }) => {
    const bundledProductModuleService: BundledProductModuleService = container.resolve(BUNDLED_PRODUCT_MODULE)
    
    try {
      // Get bundle WITHOUT relationships to avoid MikroORM issues
      const bundles = await bundledProductModuleService.listBundles({ id })
      
      if (!bundles || bundles.length === 0) {
        return new StepResponse({
          bundle: null as any,
          itemIds: [] as string[],
          productId: null as string | null
        })
      }
      
      // Get items separately
      const items = await bundledProductModuleService.listBundleItems({
        bundle_id: id
      })
      
      // Get linked wrapper product using query
      const query = container.resolve("query")
      let productId = null
      
      try {
        const result: any = await query.graph({
          entity: "bundle",
          fields: ["id", "product.id"],
          filters: { id },
        })
        
        if (result && result.data && result.data[0] && result.data[0].product) {
          productId = result.data[0].product.id
        }
      } catch (e: any) {
        console.log("[FETCH BUNDLE DATA] Could not fetch bundle wrapper product:", e.message)
      }
      
      return new StepResponse({
        bundle: bundles[0] as any,
        itemIds: items.map(i => i.id) as string[],
        productId
      })
    } catch (e) {
      console.log("Error fetching bundle data:", id, e.message)
      return new StepResponse({
        bundle: null as any,
        itemIds: [] as string[],
        productId: null as string | null
      })
    }
  }
)

export const deleteBundledProductWorkflow = createWorkflow(
  "delete-bundled-product",
  ({ id }: DeleteBundledProductWorkflowInput) => {
    
    // Fetch all bundle data FIRST (before any deletion) to avoid MikroORM relationship issues
    const bundleData = fetchBundleDataStep({ id })

    // Delete bundle items
    const itemIds = transform({ bundleData }, (data) => {
      return (data.bundleData as any).itemIds || []
    })
    
    deleteBundleItemsStep({ ids: itemIds })

    // Delete the bundle itself
    const bundleToDelete = transform({ bundleData }, (data) => {
      return (data.bundleData as any).bundle
    })
    
    deleteBundleStep({
      id,
      bundleData: bundleToDelete
    })

    // Delete the wrapper product if it exists
    const productId = transform({ bundleData }, (data) => {
      return (data.bundleData as any).productId
    })
    
    deleteProductsWorkflow.runAsStep({
      input: transform({ productId }, ({ productId }) => {
        if (productId) {
          return { ids: [productId] }
        }
        return { ids: [] }
      })
    })

    return new WorkflowResponse({ id, deleted: true })
  }
)
