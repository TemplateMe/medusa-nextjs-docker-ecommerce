import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an email notification to the customer when an order is placed
 * This provides order confirmation and details to the customer
 */
export default async function orderPlacedEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get order details for the email
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
        "items.*",
        "items.product.*",
        "items.variant.*",
        "shipping_address.*",
      ],
      filters: {
        id: data.id,
      },
    })

    const order = orders?.[0] as any

    if (!order || !order.email) {
      logger.warn(`Order or email not found for email notification: ${data.id}`)
      return
    }

    // Format the total amount
    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.currency_code?.toUpperCase() || "USD",
    }).format((order.total || 0) / 100)

    // Build items list for email
    const itemsList = order.items?.map((item: any) => {
      const itemTotal = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: order.currency_code?.toUpperCase() || "USD",
      }).format((item.total || 0) / 100)
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.product?.title || "Product"} ${item.variant?.title ? `(${item.variant.title})` : ""}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ${itemTotal}
          </td>
        </tr>
      `
    }).join("") || ""

    // Create email notification
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-confirmation",
      content: {
        subject: `Order Confirmation #${order.display_id}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0;">Order Confirmation</h1>
              </div>
              
              <p>Hi ${order.customer?.first_name || "Customer"},</p>
              
              <p>Thank you for your order! We've received your order and will process it shortly.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #2c3e50;">Order #${order.display_id}</h2>
                <p style="margin: 5px 0;"><strong>Total:</strong> ${formattedTotal}</p>
              </div>
              
              <h3 style="color: #2c3e50;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">${formattedTotal}</td>
                  </tr>
                </tfoot>
              </table>
              
              ${order.shipping_address ? `
                <h3 style="color: #2c3e50;">Shipping Address</h3>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                  <p style="margin: 5px 0;">${order.shipping_address.first_name} ${order.shipping_address.last_name}</p>
                  <p style="margin: 5px 0;">${order.shipping_address.address_1}</p>
                  ${order.shipping_address.address_2 ? `<p style="margin: 5px 0;">${order.shipping_address.address_2}</p>` : ""}
                  <p style="margin: 5px 0;">${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.postal_code}</p>
                  <p style="margin: 5px 0;">${order.shipping_address.country_code?.toUpperCase()}</p>
                </div>
              ` : ""}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                <p>If you have any questions, please contact our support team.</p>
                <p>Thank you for shopping with us!</p>
              </div>
            </body>
          </html>
        `,
      },
    })

    logger.info(`Order confirmation email sent to: ${order.email} for order: ${order.display_id}`)
  } catch (error: any) {
    logger.error(`Failed to send order confirmation email: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

