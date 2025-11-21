import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an admin notification when a new customer registers
 * This helps admins track new customer signups
 */
export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get customer details
    const query = container.resolve("query")
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: [
        "id",
        "email",
        "first_name",
        "last_name",
        "created_at",
      ],
      filters: {
        id: data.id,
      },
    })

    const customer = customers?.[0]

    if (!customer) {
      logger.warn(`Customer not found for notification: ${data.id}`)
      return
    }

    const customerName = customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : customer.email

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "New Customer Registered",
        description: `${customerName} just created an account`,
      },
    })

    logger.info(`Customer created notification sent for customer: ${customer.email}`)
  } catch (error: any) {
    logger.error(`Failed to send customer created notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}

