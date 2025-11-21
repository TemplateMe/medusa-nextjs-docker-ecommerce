"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"

/**
 * Complete a cart that contains preorder items
 * This uses a special endpoint that handles preorder creation
 */
export async function completePreorderCart(cartId: string) {
  const authHeaders = await getAuthHeaders()

  const headers = {
    ...(authHeaders || {}),
  }

  try {
    const result = await sdk.client.fetch<{
      type: string
      order: HttpTypes.StoreOrder
    }>(`/store/carts/${cartId}/compleate-preorder`, {
      method: "POST",
      headers,
    })

    // Revalidate cart and order caches
    try {
      revalidateTag("cart")
      revalidateTag("order")
    } catch (error) {
      console.warn("Failed to revalidate cache:", error)
    }

    return result
  } catch (error: any) {
    console.error("Failed to complete preorder cart:", error)
    throw new Error(
      error?.message || "Failed to complete cart with preorders"
    )
  }
}

/**
 * Check if a cart contains any preorder items
 */
export function cartHasPreorderItems(cart: HttpTypes.StoreCart): boolean {
  if (!cart.items || cart.items.length === 0) {
    return false
  }

  return cart.items.some((item) => {
    const variant = item.variant as any
    return (
      variant?.preorder_variant &&
      variant.preorder_variant.status === "enabled" &&
      new Date(variant.preorder_variant.available_date) > new Date()
    )
  })
}

