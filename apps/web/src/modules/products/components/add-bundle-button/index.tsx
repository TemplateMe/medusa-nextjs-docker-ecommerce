"use client"

import { useState } from "react"
import { addBundleToCart } from "@lib/data/bundles"
import { Button } from "@medusajs/ui"
import { Plus, Check } from "@medusajs/icons"
import { useTranslation } from "@lib/i18n"

type AddBundleButtonProps = {
  bundleId: string
  countryCode: string
  variant?: "primary" | "secondary"
  size?: "base" | "large"
  className?: string
}

export default function AddBundleButton({
  bundleId,
  countryCode,
  variant = "primary",
  size = "base",
  className,
}: AddBundleButtonProps) {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAddToCart = async () => {
    if (!bundleId || isAdding) return

    setIsAdding(true)
    setSuccess(false)

    try {
      await addBundleToCart({
        bundleId,
        quantity: 1,
        countryCode,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to add bundle to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || success}
      variant={variant}
      size={size}
      className={className}
    >
      {success ? (
        <>
          <Check className="mr-2" />
          {t("bundles.addedToCart")}
        </>
      ) : isAdding ? (
        t("bundles.addingToCart")
      ) : (
        <>
          <Plus className="mr-2" />
          {t("product.addToCart")}
        </>
      )}
    </Button>
  )
}
