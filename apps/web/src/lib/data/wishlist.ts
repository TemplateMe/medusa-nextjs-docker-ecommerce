"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
} from "./cookies"

/**
 * Type definitions for wishlist data structures
 */
export type WishlistItem = {
  id: string
  product_variant_id: string
  wishlist_id: string
  created_at: string
  updated_at: string
  product_variant?: any
}

export type Wishlist = {
  id: string
  customer_id: string
  sales_channel_id: string
  items: WishlistItem[]
  created_at: string
  updated_at: string
}

/**
 * Retrieves the customer's wishlist
 * Creates a new wishlist if one doesn't exist
 * @returns The customer's wishlist or null if not authenticated
 */
export const retrieveWishlist = async (): Promise<Wishlist | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  const next = {
    ...(await getCacheOptions("wishlist")),
  }

  try {
    const { wishlist } = await sdk.client.fetch<{ wishlist: Wishlist }>(
      `/store/customers/me/wishlists`,
      {
        method: "GET",
        headers,
        next,
        cache: "force-cache",
      }
    )
    return wishlist
  } catch (error: any) {
    // If wishlist doesn't exist (404), create one
    const isNotFound =
      error?.status === 404 ||
      error?.response?.status === 404 ||
      error?.message?.toLowerCase().includes("not found") ||
      error?.message?.toLowerCase().includes("404")

    if (isNotFound) {
      try {
        return await createWishlist()
      } catch (createError) {
        console.error("Failed to create wishlist:", createError)
        return null
      }
    }
    return null
  }
}

/**
 * Creates a new wishlist for the authenticated customer
 * @returns The created wishlist
 */
export const createWishlist = async (): Promise<Wishlist> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const wishlist = await sdk.client
    .fetch<{ wishlist: Wishlist }>(`/store/customers/me/wishlists`, {
      method: "POST",
      headers,
    })
    .then(({ wishlist }) => wishlist)
    .catch(medusaError)

  // Revalidate cache after mutation
  try {
    const cacheTag = await getCacheTag("wishlist")
    if (cacheTag) {
      revalidateTag(cacheTag)
    }
  } catch (error) {
    // Ignore cache revalidation errors during SSR
    console.warn("Failed to revalidate cache:", error)
  }

  return wishlist
}

/**
 * Adds a product variant to the customer's wishlist
 * Creates a wishlist first if it doesn't exist
 * @param variantId - The ID of the product variant to add
 * @returns The updated wishlist
 */
export const addToWishlist = async (variantId: string): Promise<Wishlist> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const { wishlist } = await sdk.client.fetch<{ wishlist: Wishlist }>(
      `/store/customers/me/wishlists/items`,
      {
        method: "POST",
        headers,
        body: {
          variant_id: variantId,
        },
      }
    )

    // Revalidate cache after mutation
    try {
      const cacheTag = await getCacheTag("wishlist")
      if (cacheTag) {
        revalidateTag(cacheTag)
      }
    } catch (error) {
      // Ignore cache revalidation errors
      console.warn("Failed to revalidate cache:", error)
    }

    return wishlist
  } catch (error: any) {
    // If wishlist doesn't exist (404), create one first then add the item
    const isNotFound =
      error?.status === 404 ||
      error?.response?.status === 404 ||
      error?.message?.toLowerCase().includes("not found") ||
      error?.message?.toLowerCase().includes("404")

    if (isNotFound) {
      // Create wishlist first
      await createWishlist()

      // Try adding the item again
      const { wishlist } = await sdk.client.fetch<{ wishlist: Wishlist }>(
        `/store/customers/me/wishlists/items`,
        {
          method: "POST",
          headers,
          body: {
            variant_id: variantId,
          },
        }
      )

      // Revalidate cache after mutation
      try {
        const cacheTag = await getCacheTag("wishlist")
        if (cacheTag) {
          revalidateTag(cacheTag)
        }
      } catch (error) {
        // Ignore cache revalidation errors
        console.warn("Failed to revalidate cache:", error)
      }

      return wishlist
    }

    // For other errors, throw them
    throw error
  }
}

/**
 * Removes an item from the customer's wishlist
 * @param itemId - The ID of the wishlist item to remove
 * @returns The updated wishlist
 */
export const removeFromWishlist = async (
  itemId: string
): Promise<Wishlist> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const wishlist = await sdk.client
    .fetch<{ wishlist: Wishlist }>(
      `/store/customers/me/wishlists/items/${itemId}`,
      {
        method: "DELETE",
        headers,
      }
    )
    .then(({ wishlist }) => wishlist)
    .catch(medusaError)

  // Revalidate cache after mutation
  try {
    const cacheTag = await getCacheTag("wishlist")
    if (cacheTag) {
      revalidateTag(cacheTag)
    }
  } catch (error) {
    // Ignore cache revalidation errors
    console.warn("Failed to revalidate cache:", error)
  }

  return wishlist
}

/**
 * Generates a shareable token for the customer's wishlist
 * @returns Object containing the share token
 */
export const getWishlistShareToken = async (): Promise<{ token: string }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<{ token: string }>(`/store/customers/me/wishlists/share`, {
      method: "POST",
      headers,
    })
    .then(({ token }) => ({ token }))
    .catch(medusaError)
}

/**
 * Retrieves a wishlist using a share token (no authentication required)
 * @param token - The share token
 * @returns The shared wishlist
 */
export const retrieveSharedWishlist = async (
  token: string
): Promise<Wishlist | null> => {
  const next = {
    ...(await getCacheOptions("wishlist")),
  }

  return await sdk.client
    .fetch<{ wishlist: Wishlist }>(`/store/wishlists/${token}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ wishlist }) => wishlist)
    .catch(() => null)
}

/**
 * Checks if a variant is in the customer's wishlist
 * @param wishlist - The customer's wishlist
 * @param variantId - The variant ID to check
 * @returns True if the variant is in the wishlist
 */
export const isInWishlist = async (
  wishlist: Wishlist | null,
  variantId: string
): Promise<boolean> => {
  if (!wishlist) return false
  return wishlist.items.some(
    (item) => item.product_variant_id === variantId
  )
}

/**
 * Gets the wishlist item for a specific variant
 * @param wishlist - The customer's wishlist
 * @param variantId - The variant ID to find
 * @returns The wishlist item or undefined
 */
export const getWishlistItem = async (
  wishlist: Wishlist | null,
  variantId: string
): Promise<WishlistItem | undefined> => {
  if (!wishlist) return undefined
  return wishlist.items.find(
    (item) => item.product_variant_id === variantId
  )
}

