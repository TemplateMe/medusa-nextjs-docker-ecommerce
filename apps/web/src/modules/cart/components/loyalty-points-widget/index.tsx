"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@medusajs/ui"
import { applyLoyaltyPoints, removeLoyaltyPoints } from "@lib/data/loyalty"
import { HttpTypes } from "@medusajs/types"
import Spinner from "@modules/common/icons/spinner"
import { useTranslation } from "@lib/i18n"

type LoyaltyPointsWidgetProps = {
  cart: HttpTypes.StoreCart & {
    promotions?: HttpTypes.StorePromotion[]
    metadata?: Record<string, unknown> | null
  }
  loyaltyPoints: number
}

type LoyaltyConfig = {
  redemption_rate: number
  min_points_redemption: number
  max_points_per_order: number | null
}

export default function LoyaltyPointsWidget({
  cart,
  loyaltyPoints,
}: LoyaltyPointsWidgetProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<LoyaltyConfig | null>(null)

  // Fetch loyalty config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/loyalty/config`, {
          headers: {
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
        })
        const data = await response.json()
        setConfig(data.config)
      } catch (err) {
        console.error("Failed to load loyalty config:", err)
        // Fallback to defaults
        setConfig({
          redemption_rate: 0.1,
          min_points_redemption: 0,
          max_points_per_order: null,
        })
      }
    }
    fetchConfig()
  }, [])

  // Check if loyalty promotion is already applied
  const hasLoyaltyPromo =
    cart.metadata?.loyalty_promo_id &&
    cart.promotions?.some((p) => p.id === cart.metadata?.loyalty_promo_id)

  const hasAnyLoyaltyPromo = cart.promotions?.some(
    (p) => p.code?.toLowerCase().includes("loyalty")
  )

  const isLoyaltyApplied = hasLoyaltyPromo || hasAnyLoyaltyPromo

  // Find the loyalty promotion
  const loyaltyPromo = cart.promotions?.find(
    (p) => p.id === cart.metadata?.loyalty_promo_id || p.code?.toLowerCase().includes("loyalty")
  )

  // Get the actual points used from metadata (stored by backend)
  const pointsUsed = (cart.metadata?.loyalty_points_used as number) || 0
  
  // Calculate discount value based on config
  const discountValue = config ? pointsUsed * config.redemption_rate : pointsUsed

  // Calculate maximum usable points based on config
  const maxUsablePoints = config
    ? Math.min(
        loyaltyPoints,
        config.max_points_per_order || loyaltyPoints,
        Math.floor(cart.total / config.redemption_rate) // Can't discount more than cart total
      )
    : loyaltyPoints

  // Check if user meets minimum points requirement
  const meetsMinimum = config
    ? loyaltyPoints >= config.min_points_redemption
    : loyaltyPoints > 0

  const handleApplyPoints = async () => {
    setLoading(true)
    setError(null)

    try {
      await applyLoyaltyPoints(cart.id)
      router.refresh()
    } catch (err: any) {
      const errorMessage = err.message || t("loyalty.failedToApply")
      if (!errorMessage.toLowerCase().includes("already applied")) {
        setError(errorMessage)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePoints = async () => {
    setLoading(true)
    setError(null)

    try {
      await removeLoyaltyPoints(cart.id)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t("loyalty.failedToRemove"))
    } finally {
      setLoading(false)
    }
  }

  // Don't show if customer has no points and no loyalty promo applied
  if (loyaltyPoints === 0 && !isLoyaltyApplied) {
    return null
  }

  const formatNumber = (num: number) => num.toLocaleString()
  const formatPrice = (amount: number) => `€${amount.toFixed(2)}`

  if (!config) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      {!isLoyaltyApplied ? (
        <>
          <div className="flex items-center justify-between text-small-regular">
            <span className="text-ui-fg-base">{t("loyalty.availablePoints")}</span>
            <span className="font-semibold">
              {formatNumber(loyaltyPoints)} ({formatPrice(loyaltyPoints * config.redemption_rate)})
            </span>
          </div>
          {meetsMinimum && maxUsablePoints > 0 ? (
            <>
              <Button
                onClick={handleApplyPoints}
                disabled={loading}
                variant="secondary"
                className="w-full"
                data-testid="apply-loyalty-button"
              >
                {loading ? <Spinner /> : t("loyalty.usePoints")}
              </Button>
              <p className="text-xs text-ui-fg-subtle text-center">
                {t("loyalty.redeemUpTo", { points: formatNumber(maxUsablePoints), value: formatPrice(maxUsablePoints * config.redemption_rate) })}
              </p>
            </>
          ) : (
            <p className="text-xs text-ui-fg-subtle text-center">
              {!meetsMinimum
                ? t("loyalty.minimumRequired", { min: config.min_points_redemption })
                : t("loyalty.cartTotalTooLow")}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex flex-col gap-y-1">
              <span className="text-small-semi text-green-700 dark:text-green-400">
                ✓ {t("loyalty.pointsApplied")}
              </span>
              <span className="text-xs text-ui-fg-subtle">
                {t("loyalty.usingPoints", { points: formatNumber(pointsUsed) })}
              </span>
            </div>
            <span className="font-semibold text-green-700 dark:text-green-400">
              -{formatPrice(discountValue)}
            </span>
          </div>
          <Button
            onClick={handleRemovePoints}
            disabled={loading}
            variant="secondary"
            className="w-full"
            data-testid="remove-loyalty-button"
          >
            {loading ? <Spinner /> : t("loyalty.removeDiscount")}
          </Button>
        </>
      )}
      {error && (
        <p className="text-xs text-red-500 text-center" data-testid="loyalty-error">
          {error}
        </p>
      )}
    </div>
  )
}

