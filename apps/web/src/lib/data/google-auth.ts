"use server"

import { sdk } from "@lib/config"
import { setAuthToken } from "./cookies"
import { revalidateTag } from "next/cache"
import { getCacheTag } from "./cookies"

export async function handleGoogleCallback(queryParams: Record<string, string>) {
  try {
    console.log("[Server Action] handleGoogleCallback called with params:", queryParams)
    
    // Step 1: Send callback to validate authentication
    // This uses the SDK's callback method which handles the token automatically
    console.log("[Server Action] Calling sdk.auth.callback...")
    const token = await sdk.auth.callback("customer", "google", queryParams)
    console.log("[Server Action] Received token:", token ? "YES" : "NO")

    if (typeof token !== "string") {
      console.error("[Server Action] Invalid token type:", typeof token)
      return { success: false, error: "Invalid token received from authentication" }
    }

    // Step 2: Store the token in cookies
    console.log("[Server Action] Storing token in cookies...")
    await setAuthToken(token)

    // Step 3: Decode token to check customer status
    console.log("[Server Action] Decoding token...")
    const tokenPayload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    )
    console.log("[Server Action] Token payload:", tokenPayload)

    const email = tokenPayload.user_metadata?.email
    const authAppMetadata = tokenPayload.app_metadata || {}

    console.log("[Server Action] Email:", email)
    console.log("[Server Action] App metadata:", authAppMetadata)

    if (!email) {
      return { success: false, error: "No email found in authentication data" }
    }

    const backendUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    // Step 4: Check if customer exists by trying to fetch customer data
    console.log("[Server Action] Checking if customer exists...")
    const customerCheckResponse = await fetch(`${backendUrl}/store/customers/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    })

    console.log("[Server Action] Customer check response status:", customerCheckResponse.status)

    // If customer doesn't exist (401 or 404), we need to handle two cases:
    // Case 1: Auth identity has no customer_id metadata - create new customer normally
    // Case 2: Auth identity has customer_id metadata but customer was deleted - need to clear metadata first
    if (customerCheckResponse.status === 401 || customerCheckResponse.status === 404) {
      console.log("[Server Action] Customer doesn't exist")
      
      // Check if auth identity already has customer_id metadata
      if (authAppMetadata.customer_id) {
        console.log("[Server Action] Auth identity has stale customer_id metadata:", authAppMetadata.customer_id)
        console.log("[Server Action] This typically means the customer was deleted but auth identity remains")
        return { 
          success: false, 
          error: "Authentication identity exists but customer account was deleted. Please contact support or use email login instead." 
        }
      }
      
      console.log("[Server Action] Creating new customer...")
      try {
        // Create customer with authenticated request
        console.log("[Server Action] Making POST request to /store/customers with token...")
        const customerResponse = await fetch(`${backendUrl}/store/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({ email }),
        })

        console.log("[Server Action] Customer creation response status:", customerResponse.status)

        if (!customerResponse.ok) {
          const errorText = await customerResponse.text()
          console.error("[Server Action] Customer creation failed:", errorText)
          return { success: false, error: "Failed to create customer account" }
        }

        const customerData = await customerResponse.json()
        console.log("[Server Action] Customer created successfully:", customerData?.customer?.id)

        // Step 5: Refresh token to get updated customer info with actor_id
        console.log("[Server Action] Refreshing token...")
        const refreshResponse = await fetch(`${backendUrl}/auth/token/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
        })

        console.log("[Server Action] Token refresh response status:", refreshResponse.status)

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text()
          console.error("[Server Action] Token refresh failed:", errorText)
          return { success: false, error: "Failed to refresh authentication token" }
        }

        const refreshData = await refreshResponse.json()
        const newToken = refreshData?.token
        
        if (typeof newToken === "string") {
          console.log("[Server Action] Token refreshed, storing new token...")
          await setAuthToken(newToken)
          console.log("[Server Action] New token stored successfully")
        } else {
          console.error("[Server Action] Token refresh returned invalid type:", typeof newToken)
          return { success: false, error: "Failed to refresh authentication token" }
        }
      } catch (createError: any) {
        console.error("[Server Action] Error creating customer:", createError)
        return { success: false, error: "Failed to create customer account" }
      }
    } else if (customerCheckResponse.ok) {
      console.log("[Server Action] Customer already exists and is active")
    } else {
      console.error("[Server Action] Unexpected response from customer check:", customerCheckResponse.status)
      return { success: false, error: "Failed to verify customer account" }
    }

    // Revalidate customer cache
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    console.log("[Server Action] Success!")
    return { success: true }
  } catch (error: any) {
    console.error("[Server Action] Google callback error:", error)
    return { success: false, error: error.message || "An error occurred during authentication" }
  }
}
