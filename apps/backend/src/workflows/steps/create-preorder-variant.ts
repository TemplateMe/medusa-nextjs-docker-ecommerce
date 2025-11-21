import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import PreorderModuleService from "../../modules/preorder/service";

type StepInput = {
  variant_id: string
  available_date: Date
}

export const createPreorderVariantStep = createStep(
  "create-preorder-variant",
  async (input: StepInput, { container }) => {
    const preorderModuleService: PreorderModuleService = container.resolve(
      "preorder"
    )

    const preorderVariant = await preorderModuleService.createPreorderVariants(
      input
    )

    return new StepResponse(preorderVariant, preorderVariant.id)
  },
  async (preorderVariantId, { container }) => {
    if (!preorderVariantId) {
      return
    }

    const preorderModuleService: PreorderModuleService = container.resolve(
      "preorder"
    )

    await preorderModuleService.deletePreorderVariants(preorderVariantId)
  }
)