import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IEventBusModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type StepInput = {
  preorder_ids: string[]
}

/**
 * Step to emit preorder.created events for notifications
 * This is separated from the create step to ensure events are emitted after preorders are persisted
 */
export const emitPreorderEventsStep = createStep(
  "emit-preorder-events",
  async ({ preorder_ids }: StepInput, { container }) => {
    const eventBusModuleService: IEventBusModuleService = container.resolve(
      Modules.EVENT_BUS
    )

    // Emit event for each preorder
    for (const preorderId of preorder_ids) {
      await eventBusModuleService.emit({
        name: "preorder.created",
        data: {
          id: preorderId,
        },
      })
    }

    return new StepResponse(null)
  }
)

