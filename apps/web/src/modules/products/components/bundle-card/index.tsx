"use client"

import { BundledProduct } from "@lib/data/bundles"
import { HttpTypes } from "@medusajs/types"
import { Badge, Heading, Text } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

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

type BundleCardProps = {
  bundle: BundledProduct
  region?: HttpTypes.StoreRegion
}

export default function BundleCard({ bundle, region }: BundleCardProps) {
  const product = bundle.product
  const itemCount = bundle.items.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate bundle total price
  const bundlePrice = product?.variants?.[0]?.calculated_price?.calculated_amount
  const currencyCode = product?.variants?.[0]?.calculated_price?.currency_code || region?.currency_code

  // Calculate individual items total for savings display
  const individualTotal = bundle.items.reduce((sum, item) => {
    const price = item.variant?.calculated_price?.calculated_amount || 0
    return sum + (price * item.quantity)
  }, 0)

  const savings = bundlePrice && individualTotal > bundlePrice 
    ? individualTotal - bundlePrice 
    : 0

  return (
    <div className="group relative border border-ui-border-base rounded-lg overflow-hidden hover:shadow-elevation-card-hover transition-shadow bg-ui-bg-base">
      <LocalizedClientLink
        href={`/bundles/${bundle.id}`}
        className="flex flex-col h-full"
      >
        {/* Bundle Image */}
        <div className="relative aspect-square overflow-hidden bg-ui-bg-subtle">
          {product?.thumbnail || product?.images?.[0] ? (
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <PackageIcon size={48} className="text-ui-fg-muted" />
            </div>
          )}
          
          {/* Bundle Badge */}
          <div className="absolute top-2 left-2">
            <Badge size="small" color="purple">
              <PackageIcon size={12} className="mr-1 inline-block" />
              Bundle
            </Badge>
          </div>

          {/* Savings Badge */}
          {savings > 0 && currencyCode && (
            <div className="absolute top-2 right-2">
              <Badge size="small" color="green">
                Save{" "}
                {convertToLocale({
                  amount: savings,
                  currency_code: currencyCode,
                })}
              </Badge>
            </div>
          )}
        </div>

        {/* Bundle Info */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex-1">
            <Heading level="h3" className="text-base font-medium mb-2">
              {bundle.title}
            </Heading>
            
            <Text className="text-sm text-ui-fg-subtle mb-3">
              {itemCount} {itemCount === 1 ? "item" : "items"} included
            </Text>

            {/* Bundle Items Preview */}
            <div className="space-y-1 mb-3">
              {bundle.items.slice(0, 3).map((item, idx) => (
                <Text key={idx} className="text-xs text-ui-fg-subtle flex items-start">
                  <span className="mr-1">•</span>
                  <span className="flex-1">
                    {item.quantity}x {item.variant?.product?.title || "Product"}
                    {item.variant?.title && item.variant.title !== "Default Variant" && (
                      <span className="text-ui-fg-muted"> ({item.variant.title})</span>
                    )}
                  </span>
                </Text>
              ))}
              {bundle.items.length > 3 && (
                <Text className="text-xs text-ui-fg-muted italic">
                  +{bundle.items.length - 3} more
                </Text>
              )}
            </div>
          </div>

          {/* Price */}
          {bundlePrice !== undefined && bundlePrice !== null && currencyCode && (
            <div className="mt-auto pt-3 border-t border-ui-border-base">
              <div className="flex items-baseline gap-2">
                <Text className="text-lg font-semibold">
                  {convertToLocale({
                    amount: bundlePrice,
                    currency_code: currencyCode,
                  })}
                </Text>
                {savings > 0 && (
                  <Text className="text-sm text-ui-fg-muted line-through">
                    {convertToLocale({
                      amount: individualTotal,
                      currency_code: currencyCode,
                    })}
                  </Text>
                )}
              </div>
              {savings > 0 && (
                <Text className="text-xs text-green-600 mt-1">
                  Save{" "}
                  {Math.round((savings / individualTotal) * 100)}% when buying together
                </Text>
              )}
            </div>
          )}
        </div>
      </LocalizedClientLink>
    </div>
  )
}
