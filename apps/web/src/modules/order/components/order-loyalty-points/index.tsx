import { HttpTypes } from "@medusajs/types"

type OrderLoyaltyPointsProps = {
  order: HttpTypes.StoreOrder & {
    cart?: {
      promotions?: HttpTypes.StorePromotion[]
      metadata?: Record<string, any>
    }
  }
  loyaltyPoints: number
}

export default function OrderLoyaltyPoints({
  order,
  loyaltyPoints,
}: OrderLoyaltyPointsProps) {
  // Check if loyalty promotion was used
  const hasLoyaltyPromo =
    order.cart?.metadata?.loyalty_promo_id &&
    order.cart?.promotions?.some(
      (p) => p.id === order.cart?.metadata?.loyalty_promo_id
    )

  const loyaltyPromo = order.cart?.promotions?.find(
    (p) => p.id === order.cart?.metadata?.loyalty_promo_id
  )

  const discountAmount = loyaltyPromo?.application_method?.value || 0
  const pointsUsed = Math.floor(discountAmount / 100)

  // Calculate points earned from this order
  const orderTotal = order.total || 0
  const pointsEarned = Math.floor(orderTotal / 100)

  if (hasLoyaltyPromo) {
    // Points were used
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎁</div>
          <div className="flex-1">
            <h3 className="text-large-semi mb-2">
              Loyalty Points Redeemed
            </h3>
            <p className="text-base-regular text-ui-fg-subtle mb-1">
              You used <span className="font-semibold">{pointsUsed.toLocaleString()} points</span> for a discount of{" "}
              <span className="font-semibold">${(discountAmount / 100).toLocaleString()}.00</span>
            </p>
            <p className="text-small-regular text-ui-fg-subtle">
              Current balance: {loyaltyPoints.toLocaleString()} points
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pointsEarned > 0) {
    // Points were earned
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎉</div>
          <div className="flex-1">
            <h3 className="text-large-semi text-green-800 dark:text-green-300 mb-2">
              Congratulations! You Earned Points
            </h3>
            <p className="text-base-regular text-green-700 dark:text-green-400 mb-1">
              You earned <span className="font-bold text-xl">{pointsEarned.toLocaleString()} loyalty points</span> from this order!
            </p>
            <p className="text-small-regular text-ui-fg-subtle">
              New balance: {loyaltyPoints.toLocaleString()} points (worth ${loyaltyPoints.toLocaleString()}.00)
            </p>
            <p className="text-xs text-ui-fg-subtle mt-3">
              💡 Use your points on your next purchase to get an instant discount!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
