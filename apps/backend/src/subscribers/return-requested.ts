import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an admin notification when a return is requested
 * This helps admins process returns promptly
 */
export default async function returnRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; return_id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get return details
    const query = container.resolve("query")
    const { data: returns } = await query.graph({
      entity: "return",
      fields: [
        "id",
        "order.display_id",
        "order.email",
        "order.customer.first_name",
        "order.customer.last_name",
        "items.quantity",
      ],
      filters: {
        id: data.return_id || data.id,
      },
    })

    const returnData = returns?.[0] as any

    if (!returnData) {
      logger.warn(`Return not found for notification: ${data.return_id || data.id}`)
      return
    }

    const customerName = returnData.order?.customer?.first_name && returnData.order?.customer?.last_name
      ? `${returnData.order.customer.first_name} ${returnData.order.customer.last_name}`
      : returnData.order?.email || "Unknown Customer"

    const itemCount = returnData.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "Return Requested",
        description: `${customerName} requested a return for Order #${returnData.order?.display_id || returnData.order?.id || "N/A"} (${itemCount} item${itemCount !== 1 ? "s" : ""})`,
      },
    })

    logger.info(`Return requested notification sent for return: ${returnData.id}`)
  } catch (error: any) {
    logger.error(`Failed to send return requested notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "return.requested",
}

