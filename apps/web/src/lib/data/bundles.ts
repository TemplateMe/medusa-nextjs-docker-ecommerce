"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import medusaError from "@lib/util/medusa-error"
import { getOrSetCart } from "./cart"

export type BundleItem = {
  id: string
  variant_id: string
  quantity: number
  product?: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant & {
    product?: HttpTypes.StoreProduct
  }
}

export type BundledProduct = {
  id: string
  title: string
  product_id: string
  product?: HttpTypes.StoreProduct
  items: BundleItem[]
  created_at: string
  updated_at: string
}

/**
 * Fetches a bundle by its ID
 */
export async function getBundleProduct(
  bundleId: string,
  regionId?: string,
  currencyCode?: string
): Promise<BundledProduct | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  try {
    const queryParams = new URLSearchParams()
    if (regionId) queryParams.append("region_id", regionId)
    if (currencyCode) queryParams.append("currency_code", currencyCode)
    
    const queryString = queryParams.toString()
    const url = `/store/bundle-products/${bundleId}${queryString ? `?${queryString}` : ''}`

    const response = await sdk.client.fetch<{ bundle_product: BundledProduct }>(
      url,
      {
        method: "GET",
        headers,
        next,
        cache: "no-store",
      }
    )

    return response.bundle_product || null
  } catch (error) {
    console.error("Error fetching bundle:", error)
    return null
  }
}

/**
 * Fetches all bundle products
 */
export async function listBundleProducts(
  regionId?: string,
  currencyCode?: string
): Promise<BundledProduct[]> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  try {
    const queryParams = new URLSearchParams()
    if (regionId) queryParams.append("region_id", regionId)
    if (currencyCode) queryParams.append("currency_code", currencyCode)
    
    const queryString = queryParams.toString()
    const url = `/store/bundle-products${queryString ? `?${queryString}` : ''}`

    const response = await sdk.client.fetch<{ bundle_products: BundledProduct[] }>(
      url,
      {
        method: "GET",
        headers,
        next,
        cache: "no-store", // Disable cache to ensure parameters are sent
      }
    )

    return response.bundle_products || []
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return []
  }
}

/**
 * Adds a bundle to the cart
 */
export async function addBundleToCart({
  bundleId,
  quantity = 1,
  countryCode,
}: {
  bundleId: string
  quantity?: number
  countryCode: string
}) {
  // Get or create cart for the region
  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Failed to get or create cart")
  }

  // Get the full cart with region details to get currency_code
  const fullCart = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
    `/store/carts/${cart.id}`,
    {
      method: "GET",
      query: {
        fields: "id,region_id,currency_code,region.*"
      },
      headers: await getAuthHeaders(),
    }
  )

  const currencyCode = fullCart.cart.currency_code || fullCart.cart.region?.currency_code

  if (!currencyCode) {
    throw new Error("Could not determine cart currency")
  }

  // Fetch the bundle to get its items - pass BOTH region_id AND currency_code
  const bundle = await getBundleProduct(
    bundleId, 
    cart.region_id, 
    currencyCode
  )
  
  if (!bundle || !bundle.items || bundle.items.length === 0) {
    throw new Error("Bundle not found or has no items")
  }

  // Map bundle items to the format expected by the backend
  const items = bundle.items.map((item: any) => ({
    item_id: item.id,
    variant_id: item.variant?.id || item.variant_id,
  }))

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const response = await sdk.client.fetch(
      `/store/carts/${cart.id}/line-item-bundles`,
      {
        method: "POST",
        headers,
        body: {
          bundle_id: bundleId,
          quantity,
          items,
        },
      }
    )

    // Revalidate cart cache
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)

    return response
  } catch (error) {
    console.error("Error adding bundle to cart:", error)
    throw error
  }
}

/**
 * Gets bundles that include a specific product variant
 */
export async function getBundlesWithVariant(
  variantId: string,
  regionId?: string,
  currencyCode?: string
): Promise<BundledProduct[]> {
  const bundles = await listBundleProducts(regionId, currencyCode)
  
  return bundles.filter((bundle) =>
    bundle.items.some((item) => item.variant_id === variantId)
  )
}

/**
 * Gets bundles for a specific product
 */
export async function getBundlesForProduct(
  productId: string,
  regionId?: string,
  currencyCode?: string
): Promise<BundledProduct[]> {
  const bundles = await listBundleProducts(regionId, currencyCode)
  
  return bundles.filter((bundle) => {
    // Check if the main bundle product matches
    if (bundle.product_id === productId) {
      return true
    }
    // Check if any bundle items include this product
    return bundle.items.some(
      (item) => item.variant?.product?.id === productId
    )
  })
}
