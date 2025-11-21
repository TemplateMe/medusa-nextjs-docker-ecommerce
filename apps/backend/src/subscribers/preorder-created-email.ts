import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends an email notification when a preorder is created
 * This confirms the preorder and provides expected availability information
 */
export default async function preorderCreatedEmailHandler({
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
        "item.product_variant.product.thumbnail",
      ],
      filters: {
        id: data.id,
      },
    })

    const preorder = preorders?.[0] as any

    if (!preorder) {
      logger.warn(`Preorder not found for email notification: ${data.id}`)
      return
    }

    // Get order details to get customer email
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "customer.first_name",
        "customer.last_name",
      ],
      filters: {
        id: preorder.order_id,
      },
    })

    const order = orders?.[0] as any

    if (!order || !order.email) {
      logger.warn(`Order or email not found for preorder email: ${preorder.order_id}`)
      return
    }

    const productTitle = preorder.item?.product_variant?.product?.title || "Product"
    const variantTitle = preorder.item?.product_variant?.title || ""
    const productImage = preorder.item?.product_variant?.product?.thumbnail || ""
    const availableDate = preorder.item?.available_date
      ? new Date(preorder.item.available_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "To be announced"

    const customerName = order.customer?.first_name || "Customer"

    // Create preorder confirmation email
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: "preorder-confirmation",
      content: {
        subject: `Pre-order Confirmed - ${productTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #2196F3; padding: 30px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Pre-order Confirmed!</h1>
              </div>
              
              <p>Hi ${customerName},</p>
              
              <p>Great news! Your pre-order has been confirmed. We'll notify you as soon as your item is ready to ship.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                ${productImage ? `
                  <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${productImage}" alt="${productTitle}" style="max-width: 200px; border-radius: 5px;">
                  </div>
                ` : ""}
                
                <h2 style="margin-top: 0; color: #2c3e50;">${productTitle}</h2>
                ${variantTitle ? `<p style="color: #6c757d; margin: 5px 0;">${variantTitle}</p>` : ""}
                
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 15px;">
                  <p style="margin: 0; font-weight: bold; color: #1976d2;">
                    📅 Expected Availability: ${availableDate}
                  </p>
                </div>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">What Happens Next?</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li style="margin: 8px 0;">We'll prepare your item as soon as it becomes available</li>
                  <li style="margin: 8px 0;">You'll receive a shipping notification when it's on its way</li>
                  <li style="margin: 8px 0;">Track your pre-order status in your account dashboard</li>
                </ul>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.display_id}</p>
                <p style="margin: 5px 0;"><strong>Pre-order Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending</span></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.STORE_URL || "http://localhost:8000"}/account/preorders" 
                   style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Pre-order Status
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                <p>Thank you for your patience! We're working hard to get your item to you.</p>
                <p>Questions? Contact our support team anytime.</p>
              </div>
            </body>
          </html>
        `,
      },
    })

    logger.info(`Preorder confirmation email sent to: ${order.email} for preorder: ${preorder.id}`)
  } catch (error: any) {
    logger.error(`Failed to send preorder confirmation email: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "preorder.created",
}

