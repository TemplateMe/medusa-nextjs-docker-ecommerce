import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../../../../../workflows/generate-invoice-pdf"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    const { result } = await generateInvoicePdfWorkflow(req.scope)
      .run({
        input: {
          order_id: id
        }
      })

    const pdfBase64 = result?.pdf_buffer
    
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      res.status(500).json({ error: 'Failed to generate PDF invoice' })
      return
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(pdfBase64, 'base64')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`)
    res.setHeader('Content-Length', buffer.length.toString())
    
    res.end(buffer, 'binary')
  } catch (error: any) {
    console.error('[DOWNLOAD] Error generating invoice:', error)
    res.status(500).json({ error: 'Failed to download invoice', message: error?.message })
  }
}
