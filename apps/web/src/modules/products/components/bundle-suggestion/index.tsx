"use client"

import { BundledProduct } from "@lib/data/bundles"
import { Badge, Heading, Text } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddBundleButton from "@modules/products/components/add-bundle-button"
import { useTranslation } from "@lib/i18n"

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

type BundleSuggestionProps = {
  bundle: BundledProduct
  countryCode: string
  showAddButton?: boolean
}

export default function BundleSuggestion({
  bundle,
  countryCode,
  showAddButton = true,
}: BundleSuggestionProps) {
  const { t } = useTranslation()
  const product = bundle.product
  const itemCount = bundle.items.reduce((sum, item) => sum + item.quantity, 0)

  const bundlePrice = product?.variants?.[0]?.calculated_price?.calculated_amount
  const currencyCode = product?.variants?.[0]?.calculated_price?.currency_code

  const individualTotal = bundle.items.reduce((sum, item) => {
    const price = item.variant?.calculated_price?.calculated_amount || 0
    return sum + (price * item.quantity)
  }, 0)

  const savings = bundlePrice && individualTotal > bundlePrice 
    ? individualTotal - bundlePrice 
    : 0

  return (
    <div className="border border-ui-border-base rounded-lg p-4 hover:border-ui-border-strong transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-1">
          <PackageIcon size={20} className="text-ui-fg-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge size="small" color="purple">
              {t("bundles.bundle")}
            </Badge>
            {savings > 0 && currencyCode && (
              <Badge size="small" color="green">
                {t("bundles.save")}{" "}
                {convertToLocale({
                  amount: savings,
                  currency_code: currencyCode,
                })}
              </Badge>
            )}
          </div>
          
          <LocalizedClientLink
            href={`/bundles/${bundle.id}`}
            className="hover:text-ui-fg-interactive"
          >
            <Heading level="h3" className="text-sm font-medium mb-1">
              {bundle.title}
            </Heading>
          </LocalizedClientLink>
          
          <Text className="text-xs text-ui-fg-subtle mb-2">
            {t("bundles.itemsIncluded", { count: itemCount })}
          </Text>

          {bundlePrice !== undefined && bundlePrice !== null && currencyCode && (
            <div className="flex items-baseline gap-2 mb-3">
              <Text className="text-base font-semibold">
                {convertToLocale({
                  amount: bundlePrice,
                  currency_code: currencyCode,
                })}
              </Text>
              {savings > 0 && (
                <Text className="text-xs text-ui-fg-muted line-through">
                  {convertToLocale({
                    amount: individualTotal,
                    currency_code: currencyCode,
                  })}
                </Text>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <LocalizedClientLink
          href={`/bundles/${bundle.id}`}
          className="flex-1"
        >
          <button className="w-full px-3 py-2 text-sm border border-ui-border-base rounded-md hover:bg-ui-bg-subtle transition-colors">
            {t("bundles.viewDetails")}
          </button>
        </LocalizedClientLink>
        
        {showAddButton && (
          <div className="flex-1">
            <AddBundleButton
              bundleId={bundle.id}
              countryCode={countryCode}
              variant="primary"
              size="base"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
