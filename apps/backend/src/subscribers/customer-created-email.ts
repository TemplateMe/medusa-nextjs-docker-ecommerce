import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber that sends a welcome email to new customers
 * This helps onboard new customers and build engagement
 */
export default async function customerCreatedEmailHandler({
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

    if (!customer || !customer.email) {
      logger.warn(`Customer or email not found for welcome email: ${data.id}`)
      return
    }

    const customerName = customer.first_name || "there"

    // Create welcome email notification
    await notificationModuleService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "customer-welcome",
      content: {
        subject: "Welcome to Our Store!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #4CAF50; padding: 30px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome to Our Store!</h1>
              </div>
              
              <p>Hi ${customerName},</p>
              
              <p>Thank you for creating an account with us! We're excited to have you as part of our community.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #2c3e50;">What's Next?</h2>
                <ul style="padding-left: 20px;">
                  <li style="margin: 10px 0;">Browse our latest products and collections</li>
                  <li style="margin: 10px 0;">Add items to your wishlist for later</li>
                  <li style="margin: 10px 0;">Track your orders in your account dashboard</li>
                  <li style="margin: 10px 0;">Enjoy exclusive member benefits and promotions</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.STORE_URL || "http://localhost:8000"}" 
                   style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Start Shopping
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                <p>Need help? Contact our support team anytime.</p>
                <p>We're here to make your shopping experience amazing!</p>
              </div>
            </body>
          </html>
        `,
      },
    })

    logger.info(`Welcome email sent to: ${customer.email}`)
  } catch (error: any) {
    logger.error(`Failed to send welcome email: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}

