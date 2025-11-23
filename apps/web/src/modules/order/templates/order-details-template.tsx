"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  // Check if order has invoice metadata (cast to any to access metadata)
  const hasInvoice = !!(order as any).metadata?.invoice_id || !!(order as any).metadata?.has_invoice
  
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }
  
  const handleDownloadInvoice = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      
      // Get auth token from cookies
      const token = getCookie("_medusa_jwt")
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      }
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
      
      const response = await fetch(`${backendUrl}/store/orders/${order.id}/invoices`, {
        headers,
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Failed to download invoice")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${order.display_id || order.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading invoice:", error)
      alert("Failed to download invoice. Please try again.")
    }
  }

  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl-semi">Order details</h1>
        <div className="flex gap-2 items-center">
          {hasInvoice && (
            <button
              onClick={handleDownloadInvoice}
              className="flex gap-2 items-center px-4 py-2 bg-ui-fg-base text-ui-fg-on-color rounded-md hover:bg-ui-fg-base/90 transition-colors"
              data-testid="download-invoice-button"
            >
              Download Invoice
            </button>
          )}
          <LocalizedClientLink
            href="/account/orders"
            className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
            data-testid="back-to-overview-button"
          >
            <XMark /> Back to overview
          </LocalizedClientLink>
        </div>
      </div>
      <div
        className="flex flex-col gap-4 h-full bg-white w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
