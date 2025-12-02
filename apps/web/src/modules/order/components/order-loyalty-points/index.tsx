import { HttpTypes } from "@medusajs/types"
import { getDictionary, createTranslator } from "@lib/i18n"

type OrderLoyaltyPointsProps = {
  order: HttpTypes.StoreOrder & {
    cart?: {
      promotions?: HttpTypes.StorePromotion[]
      metadata?: Record<string, any>
    }
  }
  loyaltyPoints: number
}

export default async function OrderLoyaltyPoints({
  order,
  loyaltyPoints,
}: OrderLoyaltyPointsProps) {
  const dictionary = await getDictionary("en")
  const t = createTranslator(dictionary)

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
              {t("loyalty.pointsRedeemed")}
            </h3>
            <p className="text-base-regular text-ui-fg-subtle mb-1">
              {t("loyalty.youUsedPoints", { points: pointsUsed.toLocaleString(), discount: (discountAmount / 100).toLocaleString() })}
            </p>
            <p className="text-small-regular text-ui-fg-subtle">
              {t("loyalty.currentBalance", { points: loyaltyPoints.toLocaleString() })}
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
              {t("loyalty.congratulationsEarnedPoints")}
            </h3>
            <p className="text-base-regular text-green-700 dark:text-green-400 mb-1">
              {t("loyalty.youEarnedPoints", { points: pointsEarned.toLocaleString() })}
            </p>
            <p className="text-small-regular text-ui-fg-subtle">
              {t("loyalty.newBalance", { points: loyaltyPoints.toLocaleString(), worth: loyaltyPoints.toLocaleString() })}
            </p>
            <p className="text-xs text-ui-fg-subtle mt-3">
              💡 {t("loyalty.usePointsTip")}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
