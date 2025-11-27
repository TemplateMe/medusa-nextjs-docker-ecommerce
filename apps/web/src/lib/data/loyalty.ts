"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * Get customer's loyalty points balance
 */
export async function getLoyaltyPoints(): Promise<number> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    return 0
  }

  try {
    const response = await sdk.client.fetch<{ points: number }>(
      `/store/customers/me/loyalty-points`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    )

    return response.points || 0
  } catch (error) {
    console.error("Failed to fetch loyalty points:", error)
    return 0
  }
}

/**
 * Apply loyalty points to cart
 */
export async function applyLoyaltyPoints(cartId: string) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await sdk.client.fetch<{ cart: any }>(
      `/store/carts/${cartId}/loyalty-points`,
      {
        method: "POST",
        headers: authHeaders,
      }
    )

    return response.cart
  } catch (error: any) {
    throw new Error(error?.message || "Failed to apply loyalty points")
  }
}

/**
 * Remove loyalty points from cart
 */
export async function removeLoyaltyPoints(cartId: string) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await sdk.client.fetch<{ cart: any }>(
      `/store/carts/${cartId}/loyalty-points`,
      {
        method: "DELETE",
        headers: authHeaders,
      }
    )

    return response.cart
  } catch (error: any) {
    throw new Error(error?.message || "Failed to remove loyalty points")
  }
}
