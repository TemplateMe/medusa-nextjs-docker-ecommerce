"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export type Review = {
  id: string
  title: string | null
  content: string
  rating: number
  first_name: string
  last_name: string
  status: "pending" | "approved" | "rejected"
  product_id: string
  customer_id: string | null
  created_at: string
  updated_at: string
}

export type CreateReviewInput = {
  product_id: string
  title?: string
  content: string
  rating: number
  first_name: string
  last_name: string
}

/**
 * Get all approved reviews for a product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    // Use server-side URL for SSR, client-side URL for client components
    const backendUrl = typeof window === 'undefined' 
      ? process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    const response = await fetch(
      `${backendUrl}/store/products/${productId}/reviews`,
      {
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        next: {
          tags: [`reviews:${productId}`],
        },
      }
    )

    if (!response.ok) {
      console.error("Failed to fetch product reviews:", await response.text())
      return []
    }

    const data = await response.json()
    return data.reviews || []
  } catch (error) {
    console.error("Error fetching product reviews:", error)
    return []
  }
}

/**
 * Create a new review for a product
 */
export async function createReview(
  input: CreateReviewInput
): Promise<{ success: boolean; error?: string; review?: Review }> {
  try {
    const authHeaders = await getAuthHeaders()
    const backendUrl = typeof window === 'undefined' 
      ? process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    const headers = {
      ...authHeaders,
      "x-publishable-api-key":
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      "Content-Type": "application/json",
    }

    const response = await fetch(
      `${backendUrl}/store/reviews`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || "Failed to create review",
      }
    }

    const data = await response.json()
    
    // Revalidate the product reviews cache
    const { revalidateTag } = await import("next/cache")
    revalidateTag(`reviews:${input.product_id}`)

    return {
      success: true,
      review: data.review,
    }
  } catch (error) {
    console.error("Error creating review:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Calculate average rating and total reviews for a product
 */
export async function getProductRatingStats(productId: string): Promise<{
  averageRating: number
  totalReviews: number
  ratingDistribution: { [key: number]: number }
}> {
  const reviews = await getProductReviews(productId)

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / reviews.length

  const ratingDistribution = reviews.reduce(
    (dist, review) => {
      const rating = Math.round(review.rating)
      dist[rating] = (dist[rating] || 0) + 1
      return dist
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as { [key: number]: number }
  )

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
  }
}
