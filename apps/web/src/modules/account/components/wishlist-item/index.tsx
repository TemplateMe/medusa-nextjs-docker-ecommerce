"use client"

import { Button } from "@medusajs/ui"
import Trash from "@modules/common/icons/trash"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"
import { removeFromWishlist } from "@lib/data/wishlist"
import { convertToLocale } from "@lib/util/money"

type WishlistItemProps = {
  item: any
  countryCode: string
}

/**
 * Component for displaying a single item in the wishlist
 * Includes product information, price, and remove functionality
 */
const WishlistItem = ({ item, countryCode }: WishlistItemProps) => {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await removeFromWishlist(item.id)
    } catch (error) {
      console.error("Failed to remove item from wishlist:", error)
      setRemoving(false)
    }
  }

  const variant = item.product_variant
  const product = variant?.product

  // If variant or product is not available, show minimal info
  if (!variant || !product) {
    return (
      <div className="grid grid-cols-[122px_1fr] gap-x-4">
        <div className="w-[122px] h-[122px] bg-gray-100 rounded-md" />
        <div className="flex flex-col justify-between">
          <div className="flex flex-col">
            <span className="text-gray-500">Product not available</span>
          </div>
          <Button
            variant="secondary"
            onClick={handleRemove}
            disabled={removing}
            className="w-fit"
          >
            <Trash size={16} />
            <span>Remove</span>
          </Button>
        </div>
      </div>
    )
  }

  const price = variant.calculated_price
  const priceAmount = price?.calculated_amount
  const currencyCode = price?.currency_code

  return (
    <div
      className="grid grid-cols-[122px_1fr] gap-x-4"
      data-testid="wishlist-item"
    >
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="w-[122px]"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="square"
        />
      </LocalizedClientLink>
      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-y-2">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="text-base-regular hover:underline"
          >
            <span className="font-medium">{product.title}</span>
          </LocalizedClientLink>
          {variant.title && variant.title !== "Default Variant" && (
            <span className="text-small-regular text-ui-fg-subtle">
              {variant.title}
            </span>
          )}
          {priceAmount !== undefined && currencyCode && (
            <span className="text-base-semi">
              {convertToLocale({
                amount: priceAmount,
                currency_code: currencyCode,
              })}
            </span>
          )}
        </div>
        <div className="flex gap-x-2">
          <Button
            variant="secondary"
            onClick={handleRemove}
            disabled={removing}
            isLoading={removing}
            className="w-fit"
            data-testid="remove-from-wishlist-button"
          >
            <Trash size={16} />
            <span>Remove</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WishlistItem

