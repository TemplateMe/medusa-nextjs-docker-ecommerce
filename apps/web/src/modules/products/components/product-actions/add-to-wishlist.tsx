"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import Heart from "@modules/common/icons/heart"
import { addToWishlist, removeFromWishlist, Wishlist } from "@lib/data/wishlist"
import { useRouter } from "next/navigation"

type AddToWishlistProps = {
  variantId: string
  wishlist: Wishlist | null
  isAuthenticated: boolean
  countryCode: string
}

/**
 * Component for adding/removing a product variant to/from the wishlist
 * Shows different states for unauthenticated users, and toggles between add/remove
 */
export default function AddToWishlist({
  variantId,
  wishlist,
  isAuthenticated,
  countryCode,
}: AddToWishlistProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if the variant is already in the wishlist
  const wishlistItem = wishlist?.items?.find(
    (item) => item.product_variant_id === variantId
  )
  const isInWishlist = !!wishlistItem

  const handleClick = async () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(`/${countryCode}/account`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isInWishlist && wishlistItem) {
        // Remove from wishlist
        await removeFromWishlist(wishlistItem.id)
      } else {
        // Add to wishlist
        await addToWishlist(variantId)
      }
      // Force a router refresh to update the data
      router.refresh()
    } catch (error: any) {
      console.error("Failed to update wishlist:", error)
      setError(error?.message || "Failed to update wishlist")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Button
        onClick={handleClick}
        variant="secondary"
        className="w-full h-10"
        disabled={isLoading}
        isLoading={isLoading}
        data-testid="add-to-wishlist-button"
      >
        <Heart size={20} filled={isInWishlist} />
        <span>
          {!isAuthenticated
            ? "Sign in to save"
            : isInWishlist
            ? "Remove from wishlist"
            : "Add to wishlist"}
        </span>
      </Button>
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}

