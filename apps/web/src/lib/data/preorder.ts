"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { Preorder } from "../../types/preorder"

/**
 * Retrieve all preorders for the authenticated customer
 */
export async function retrieveCustomerPreorders(): Promise<Preorder[]> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    return []
  }

  const headers = {
    ...authHeaders,
  }

  const next = {
    ...(await getCacheOptions("preorders")),
  }

  try {
    const { preorders } = await sdk.client.fetch<{ preorders: Preorder[] }>(
      `/store/customers/me/preorders`,
      {
        method: "GET",
        headers,
        next,
        cache: "no-store",
      }
    )
    return preorders || []
  } catch (error) {
    console.error("Failed to retrieve customer preorders:", error)
    return []
  }
}


