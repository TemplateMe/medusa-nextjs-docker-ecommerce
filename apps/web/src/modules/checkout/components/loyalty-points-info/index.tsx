import { HttpTypes } from "@medusajs/types"

type LoyaltyPointsInfoProps = {
  cart: HttpTypes.StoreCart & {
    promotions?: HttpTypes.StorePromotion[]
    metadata?: Record<string, any>
  }
  loyaltyPoints: number
}

export default function LoyaltyPointsInfo({
  cart,
  loyaltyPoints,
}: LoyaltyPointsInfoProps) {
  // Check if loyalty promotion is applied
  const hasLoyaltyPromo =
    cart.metadata?.loyalty_promo_id &&
    cart.promotions?.some((p) => p.id === cart.metadata?.loyalty_promo_id)

  const loyaltyPromo = cart.promotions?.find(
    (p) => p.id === cart.metadata?.loyalty_promo_id
  )

  // discountAmount is in cents, and since 1 point = $1.00 = 100 cents
  // pointsUsed = discountAmount / 100
  // But if discountAmount IS the points (already calculated on backend), use it directly
  const discountAmount = loyaltyPromo?.application_method?.value || 0
  const pointsUsed = discountAmount // discountAmount is already the number of points used

  // Calculate points that will be earned from this order
  const cartTotal = cart.total || 0
  const pointsToEarn = Math.floor(cartTotal / 100)

  if (hasLoyaltyPromo) {
    // Show points being used
    const newBalance = loyaltyPoints - pointsUsed

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="text-small-semi text-green-800 dark:text-green-300 mb-1">
              Using {pointsUsed} Loyalty Points
            </p>
            <p className="text-xs text-ui-fg-subtle">
              Your new balance will be {newBalance} points after this order
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pointsToEarn > 0) {
    // Show points that will be earned
    const newBalance = loyaltyPoints + pointsToEarn

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💰</span>
          <div className="flex-1">
            <p className="text-small-semi text-blue-800 dark:text-blue-300 mb-1">
              You'll earn {pointsToEarn.toLocaleString()} loyalty points
            </p>
            <p className="text-xs text-ui-fg-subtle">
              Your new balance will be {newBalance.toLocaleString()} points (worth
              ${newBalance.toLocaleString()}.00)
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
