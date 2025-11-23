import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"
import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types"
import InvoiceGeneratorService from "../../modules/invoice-generator/service"

export type GenerateInvoicePdfStepInput = {
  order: OrderDTO
  items: OrderLineItemDTO[]
  invoice_id: string
}

export const generateInvoicePdfStep = createStep(
  "generate-invoice-pdf",
  async (input: GenerateInvoicePdfStepInput, { container }) => {
    const invoiceGeneratorService = container.resolve<InvoiceGeneratorService>(INVOICE_MODULE)

    const previousInv = await invoiceGeneratorService.retrieveInvoice(
      input.invoice_id
    )

    const pdfBuffer = await invoiceGeneratorService.generatePdf({
      order: input.order,
      items: input.items,
      invoice_id: input.invoice_id
    })

    // Convert Buffer to base64 string for serialization
    const pdfBase64 = pdfBuffer.toString('base64')

    return new StepResponse({
      pdf_buffer: pdfBase64,
      invoice_id: input.invoice_id
    }, previousInv)
  },
  async (previousInv, { container }) => {
    if (!previousInv) {
      return
    }

    const invoiceGeneratorService = container.resolve<InvoiceGeneratorService>(INVOICE_MODULE)

    await invoiceGeneratorService.updateInvoices({
      id: previousInv.id,
      pdfContent: previousInv.pdfContent
    })
  }
) 