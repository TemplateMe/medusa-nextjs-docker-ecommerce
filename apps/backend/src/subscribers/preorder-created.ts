import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an admin notification when a preorder is created
 * This helps admins track preorder items that need special handling
 */
export default async function preorderCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get preorder details
    const query = container.resolve("query")
    const { data: preorders } = await query.graph({
      entity: "preorder",
      fields: [
        "id",
        "order_id",
        "status",
        "item.available_date",
        "item.product_variant.title",
        "item.product_variant.product.title",
      ],
      filters: {
        id: data.id,
      },
    })

    const preorder = preorders?.[0]

    if (!preorder) {
      logger.warn(`Preorder not found for notification: ${data.id}`)
      return
    }

    const productTitle = preorder.item?.product_variant?.product?.title || "Unknown Product"
    const variantTitle = preorder.item?.product_variant?.title || ""
    const availableDate = preorder.item?.available_date
      ? new Date(preorder.item.available_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown"

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "New Pre-order Created",
        description: `Pre-order for ${productTitle}${variantTitle ? ` (${variantTitle})` : ""} - Expected: ${availableDate}`,
      },
    })

    logger.info(`Preorder notification sent for preorder: ${preorder.id}`)
  } catch (error: any) {
    logger.error(`Failed to send preorder created notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "preorder.created",
}

