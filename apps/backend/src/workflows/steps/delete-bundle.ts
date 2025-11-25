import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import BundledProductModuleService from "../../modules/bundled-product/service"
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product"

type DeleteBundleStepInput = {
  id: string
  bundleData?: any // Optional: bundle data for rollback if already fetched
}

export const deleteBundleStep = createStep(
  "delete-bundle",
  async ({ id, bundleData }: DeleteBundleStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE)

    // Use provided bundle data or fetch it (without relationships to avoid issues)
    let bundle = bundleData
    if (!bundle) {
      const bundles = await bundledProductModuleService.listBundles({ id })
      bundle = bundles?.[0]
    }

    // Hard delete - pass options to force permanent deletion
    await bundledProductModuleService.deleteBundles(id, { softDelete: false } as any)

    return new StepResponse({ id, deleted: true }, bundle)
  },
  async (bundle, { container }) => {
    if (!bundle) {
      return
    }
    
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE)
      
    // Recreate the bundle if deletion needs to be rolled back
    await bundledProductModuleService.createBundles({
      id: bundle.id,
      title: bundle.title,
    })
  }
)
