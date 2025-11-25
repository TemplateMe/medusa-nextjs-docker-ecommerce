import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product"
import BundledProductModuleService from "../../modules/bundled-product/service"

type DeleteBundleItemsStepInput = {
  ids: string[]
}

export const deleteBundleItemsStep = createStep(
  "delete-bundle-items",
  async ({ ids }: DeleteBundleItemsStepInput, { container }) => {
    if (!ids?.length) {
      return new StepResponse({ deleted: 0 }, [])
    }

    const bundledProductModuleService: BundledProductModuleService = container.resolve(
      BUNDLED_PRODUCT_MODULE
    )

    // Get items data for rollback
    const items = await bundledProductModuleService.listBundleItems({
      id: ids
    })

    // Hard delete - pass options to force permanent deletion
    await bundledProductModuleService.deleteBundleItems(ids, { softDelete: false } as any)

    return new StepResponse({ deleted: ids.length }, items)
  },
  async (itemsData, { container }) => {
    if (!itemsData?.length) {
      return
    }

    const bundledProductModuleService: BundledProductModuleService = container.resolve(
      BUNDLED_PRODUCT_MODULE
    )

    // Recreate the items if deletion needs to be rolled back
    await bundledProductModuleService.createBundleItems(
      itemsData.map(item => ({
        id: item.id,
        bundle_id: item.bundle_id,
        quantity: item.quantity,
      }))
    )
  }
)
