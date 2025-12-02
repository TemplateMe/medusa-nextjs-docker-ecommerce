"use client"

import { useState } from "react"
import { addBundleToCart, BundledProduct } from "@lib/data/bundles"
import { HttpTypes } from "@medusajs/types"
import { Badge, Button, Heading, Text } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import { Plus, Check } from "@medusajs/icons"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslation } from "@lib/i18n/client"

// Simple package icon component
const PackageIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
)

type BundleDetailProps = {
  bundle: BundledProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default function BundleDetail({
  bundle,
  region,
  countryCode,
}: BundleDetailProps) {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  const product = bundle.product
  const itemCount = bundle.items.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate prices
  const bundlePrice = product?.variants?.[0]?.calculated_price?.calculated_amount
  const currencyCode = product?.variants?.[0]?.calculated_price?.currency_code || region?.currency_code

  const individualTotal = bundle.items.reduce((sum, item) => {
    const price = item.variant?.calculated_price?.calculated_amount || 0
    return sum + (price * item.quantity)
  }, 0)

  const savings = bundlePrice && individualTotal > bundlePrice 
    ? individualTotal - bundlePrice 
    : 0

  const handleAddToCart = async () => {
    if (!bundle.id || isAdding) return

    setIsAdding(true)
    setSuccess(false)

    try {
      await addBundleToCart({
        bundleId: bundle.id,
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

  const getItemsText = () => {
    if (itemCount === 1) {
      return `${itemCount} ${t("bundles.item")}`
    }
    return `${itemCount} ${t("bundles.items")}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Badge size="base" color="purple">
          <PackageIcon size={16} className="mr-1 inline-block" />
          {t("bundles.bundlePackage")}
        </Badge>
        {savings > 0 && currencyCode && (
          <Badge size="base" color="green">
            {t("bundles.saveAmount", { amount: convertToLocale({
              amount: savings,
              currency_code: currencyCode,
            })})}
          </Badge>
        )}
      </div>

      <div>
        <Heading level="h1" className="text-3xl mb-3">
          {bundle.title}
        </Heading>
        <Text className="text-ui-fg-subtle">
          {t("bundles.thisBundle", { count: getItemsText() })}
        </Text>
      </div>

      {/* Price Section */}
      {bundlePrice !== undefined && bundlePrice !== null && currencyCode && (
        <div className="bg-ui-bg-subtle rounded-lg p-6">
          <div className="flex items-baseline gap-3 mb-2">
            <Text className="text-3xl font-bold">
              {convertToLocale({
                amount: bundlePrice,
                currency_code: currencyCode,
              })}
            </Text>
            {savings > 0 && (
              <Text className="text-xl text-ui-fg-muted line-through">
                {convertToLocale({
                  amount: individualTotal,
                  currency_code: currencyCode,
                })}
              </Text>
            )}
          </div>
          {savings > 0 && (
            <Text className="text-green-600 font-medium">
              {t("bundles.saveCompared", { percent: Math.round((savings / individualTotal) * 100) })}
            </Text>
          )}
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isAdding || success}
        className="w-full"
        size="large"
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
            {t("bundles.addBundleToCart")}
          </>
        )}
      </Button>

      {/* Bundle Items */}
      <div>
        <Heading level="h2" className="text-xl mb-4">
          {t("bundles.whatsIncluded")}
        </Heading>
        <div className="space-y-4">
          {bundle.items.map((item, idx) => {
            // Use item.product for images and title (from remote link)
            // Use item.variant for price and variant info
            const itemProduct = item.product || item.variant?.product
            const itemPrice = item.variant?.calculated_price?.calculated_amount
            const itemCurrency = item.variant?.calculated_price?.currency_code

            return (
              <div
                key={idx}
                className="flex gap-4 p-4 border border-ui-border-base rounded-lg hover:border-ui-border-strong transition-colors"
              >
                {/* Thumbnail */}
                <LocalizedClientLink
                  href={`/products/${itemProduct?.handle}`}
                  className="w-20 h-20 flex-shrink-0"
                >
                  <Thumbnail
                    thumbnail={itemProduct?.thumbnail}
                    images={itemProduct?.images}
                    size="square"
                  />
                </LocalizedClientLink>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <LocalizedClientLink
                    href={`/products/${itemProduct?.handle}`}
                    className="hover:text-ui-fg-interactive"
                  >
                    <Heading level="h3" className="text-base font-medium mb-1">
                      {itemProduct?.title || "Product"}
                    </Heading>
                  </LocalizedClientLink>
                  
                  {item.variant?.title && item.variant.title !== "Default Variant" && (
                    <Text className="text-sm text-ui-fg-subtle mb-1">
                      {t("bundles.variant")} {item.variant.title}
                    </Text>
                  )}
                  
                  <Text className="text-sm text-ui-fg-muted">
                    {t("bundles.quantity")} {item.quantity}
                  </Text>
                </div>

                {/* Item Price */}
                {itemPrice !== undefined && itemPrice !== null && itemCurrency && (
                  <div className="text-right flex-shrink-0">
                    <Text className="text-sm text-ui-fg-subtle">
                      {convertToLocale({
                        amount: itemPrice * item.quantity,
                        currency_code: itemCurrency,
                      })}
                    </Text>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Value Proposition */}
      {savings > 0 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <PackageIcon size={24} className="text-green-600" />
            </div>
            <div>
              <Heading level="h3" className="text-base font-medium text-green-900 dark:text-green-100 mb-2">
                {t("bundles.whyBuyBundle")}
              </Heading>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <li>• {t("bundles.reason1")}</li>
                <li>• {t("bundles.reason2")}</li>
                <li>• {t("bundles.reason3")}</li>
                <li>• {t("bundles.reason4")}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
