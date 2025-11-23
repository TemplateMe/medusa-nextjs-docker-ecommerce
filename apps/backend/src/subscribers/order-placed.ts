import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"

/**
 * Subscriber that sends an admin notification when an order is placed
 * This notification will appear in the Medusa Admin dashboard notification panel
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    // Get order details for the notification
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
      logger.warn(`Order not found for notification: ${data.id}`)
      return
    }

    // Format the total amount
    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.currency_code?.toUpperCase() || "USD",
    }).format((order.total || 0) / 100)

    // Create notification for admin dashboard
    await notificationModuleService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: `New Order #${order.display_id || order.id}`,
        description: `${order.customer?.first_name || ""} ${order.customer?.last_name || order.email} placed an order for ${formattedTotal}`,
      },
    })

    logger.info(`Order placed notification sent for order: ${order.display_id || order.id}`)

    // Generate PDF invoice and send via email
    try {
      logger.info(`Starting PDF invoice generation for order: ${data.id}`)
      
      const { result } = await generateInvoicePdfWorkflow(container).run({
        input: {
          order_id: data.id
        }
      })

      const pdfBase64 = result?.pdf_buffer
      const invoiceId = result?.invoice_id
      
      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        throw new Error('PDF buffer is invalid or missing')
      }
      
      // Update order metadata with invoice_id
      if (invoiceId) {
        const orderModuleService = container.resolve(Modules.ORDER)
        await orderModuleService.updateOrders(data.id, {
          metadata: {
            ...(order.metadata || {}),
            invoice_id: invoiceId,
            has_invoice: true
          }
        })
      }
      
      // Convert base64 to Buffer for email attachment
      const pdfBuffer = Buffer.from(pdfBase64, 'base64')

      const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Customer'

      // Send email with PDF invoice attached
      // @ts-expect-error - The notification module's type definition expects 'content' to be a string,
      // but the underlying nodemailer provider correctly handles Buffer objects for attachments.
      // This is a known limitation of the type definitions and works correctly at runtime.
      await notificationModuleService.createNotifications({
        to: order.email || "",
        template: "order-placed-email",
        channel: "email",
        content: {
          subject: `Order Confirmation - Order #${order.display_id}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4CAF50; padding: 30px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Thank You for Your Order!</h1>
                </div>
                
                <p>Hi ${customerName},</p>
                
                <p>Thank you for your order! We've received your payment and your order is being processed.</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h2 style="color: #333; margin-top: 0;">Order Details</h2>
                  <p style="margin: 10px 0;"><strong>Order Number:</strong> #${order.display_id}</p>
                  <p style="margin: 10px 0;"><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style="margin: 10px 0;"><strong>Total Amount:</strong> ${formattedTotal}</p>
                </div>
                
                <div style="background-color: #E3F2FD; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>📄 Invoice Attached</strong></p>
                  <p style="margin: 10px 0 0 0;">Your invoice is attached to this email as a PDF document. You can also download it from your account page.</p>
                </div>
                
                <p>We'll send you another email once your order has been shipped with tracking information.</p>
                
                <p>If you have any questions about your order, please don't hesitate to contact us.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="margin: 5px 0;">Best regards,</p>
                  <p style="margin: 5px 0;"><strong>Your Store Team</strong></p>
                </div>
              </body>
            </html>
          `,
          text: `
Order Confirmation - Order #${order.display_id}

Hi ${customerName},

Thank you for your order! We've received your payment and your order is being processed.

Order Details
-------------
Order Number: #${order.display_id}
Order Date: ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Total Amount: ${formattedTotal}

Invoice Attached
----------------
Your invoice is attached to this email as a PDF document. You can also download it from your account page.

We'll send you another email once your order has been shipped with tracking information.

If you have any questions about your order, please don't hesitate to contact us.

Best regards,
Your Store Team
          `
        },
        attachments: [
          {
            content: pdfBuffer,
            filename: `invoice-${order.display_id || order.id}.pdf`,
            content_type: "application/pdf",
            disposition: "attachment"
          }
        ]
      })

      logger.info(`Order placed email with invoice sent to: ${order.email}`)
    } catch (pdfError: any) {
      logger.error(`Failed to generate or send PDF invoice: ${pdfError?.message || pdfError}`)
      logger.error(`Full error details:`, pdfError)
      logger.error(`Error stack:`, pdfError?.stack)
      // Continue execution even if PDF generation fails
    }
  } catch (error: any) {
    logger.error(`Failed to send order placed notification: ${error?.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

