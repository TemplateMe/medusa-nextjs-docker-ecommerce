import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an admin notification when product inventory is low
 * This helps admins proactively restock products before they run out
 * 
 * Triggered when inventory level is updated
 */
export default async function productLowStockHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; inventory_item_id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get inventory level details
    const query = container.resolve("query")
    const { data: inventoryLevels } = await query.graph({
      entity: "inventory_level",
      fields: [
        "id",
        "stocked_quantity",
        "reserved_quantity",
        "inventory_item.sku",
        "inventory_item.title",
      ],
      filters: {
        id: data.id,
      },
    })

    const inventoryLevel = inventoryLevels?.[0]

    if (!inventoryLevel) {
      logger.warn(`Inventory level not found for notification: ${data.id}`)
      return
    }

    const availableQuantity = inventoryLevel.stocked_quantity - inventoryLevel.reserved_quantity
    const LOW_STOCK_THRESHOLD = 5 // Alert when stock is 5 or less

    // Only send notification if stock is low
    if (availableQuantity > LOW_STOCK_THRESHOLD) {
      return
    }

    const itemName = inventoryLevel.inventory_item?.title || inventoryLevel.inventory_item?.sku || "Unknown Item"

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "Low Stock Alert",
        description: `${itemName} is running low (${availableQuantity} units remaining)`,
      },
    })

    logger.info(`Low stock notification sent for item: ${itemName} (${availableQuantity} units)`)
  } catch (error: any) {
    logger.error(`Failed to send low stock notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "inventory-level.updated",
}

