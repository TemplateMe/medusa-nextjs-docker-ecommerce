import { Metadata } from "next"
import { retrieveSharedWishlist } from "@lib/data/wishlist"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@lib/util/money"
import { getDictionary, getLocaleFromCountry, createTranslator } from "@lib/i18n"

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "View a shared wishlist.",
}

/**
 * Shared wishlist page
 * Publicly accessible page for viewing a wishlist via share token
 */
export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string; countryCode: string }>
}) {
  const { token, countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)
  const wishlist = await retrieveSharedWishlist(token)

  // If wishlist not found or invalid token
  if (!wishlist) {
    return (
      <div
        className="flex flex-col gap-y-4 h-full bg-white w-full max-w-4xl mx-auto py-12 px-4"
        data-testid="shared-wishlist-not-found"
      >
        <div className="flex flex-col gap-y-2">
          <Heading level="h1" className="text-2xl-semi">
            {t("wishlist.notFound")}
          </Heading>
          <Text className="text-base-regular text-ui-fg-subtle">
            {t("wishlist.notFoundDescription")}
          </Text>
        </div>
        <div>
          <LocalizedClientLink
            href="/"
            className="text-base-regular text-ui-fg-interactive hover:underline"
          >
            {t("common.continueShopping")}
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  const items = wishlist.items || []

  return (
    <div
      className="flex flex-col gap-y-8 h-full bg-white w-full max-w-4xl mx-auto py-12 px-4"
      data-testid="shared-wishlist-page"
    >
      {/* Header */}
      <div className="flex flex-col gap-y-2">
        <Heading level="h1" className="text-2xl-semi">
          {t("wishlist.sharedWishlist")}
        </Heading>
        <Text className="text-base-regular text-ui-fg-subtle">
          {t("wishlist.itemsCount", { count: items.length.toString(), itemText: items.length === 1 ? t("orders.item") : t("orders.items") })}
        </Text>
      </div>

      {/* Wishlist Items */}
      {items.length === 0 ? (
        <div>
          <Text className="text-base-regular text-ui-fg-subtle">
            {t("wishlist.isEmpty")}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {items.map((item) => {
            const variant = item.product_variant
            const product = variant?.product

            // If variant or product is not available, skip
            if (!variant || !product) {
              return null
            }

            const price = variant.calculated_price
            const priceAmount = price?.calculated_amount
            const currencyCode = price?.currency_code

            return (
              <div
                key={item.id}
                className="grid grid-cols-[122px_1fr] gap-x-4 pb-4 border-b border-gray-200 last:border-b-0"
                data-testid="shared-wishlist-item"
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
                  <div>
                    <LocalizedClientLink
                      href={`/products/${product.handle}`}
                      className="text-base-regular text-ui-fg-interactive hover:underline"
                    >
                      {t("products.viewProduct")}
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

