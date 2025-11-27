import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an admin notification when an order is canceled
 * This helps admins track order cancellations and take necessary actions
 */
export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get order details
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "currency_code",
        "customer.first_name",
        "customer.last_name",
      ],
      filters: {
        id: data.id,
      },
    })

    const order = orders?.[0] as any

    if (!order) {
      logger.warn(`Order not found for cancellation notification: ${data.id}`)
      return
    }

    // Format the total amount
    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.currency_code?.toUpperCase() || "USD",
    }).format(order.total || 0)

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: `Order #${order.display_id || order.id} Canceled`,
        description: `Order for ${formattedTotal} by ${order.customer?.first_name || ""} ${order.customer?.last_name || order.email} was canceled`,
      },
    })

    logger.info(`Order canceled notification sent for order: ${order.display_id || order.id}`)
  } catch (error: any) {
    logger.error(`Failed to send order canceled notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
