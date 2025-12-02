import { listBundleProducts } from "@lib/data/bundles"
import { getRegion } from "@lib/data/regions"
import { Heading, Text } from "@medusajs/ui"
import BundleCard from "@modules/products/components/bundle-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import InteractiveLink from "@modules/common/components/interactive-link"
import { getDictionary, createTranslator } from "@lib/i18n/dictionary"
import { getLocaleFromCountry } from "@lib/i18n/config"

type FeaturedBundlesProps = {
  countryCode: string
  limit?: number
  title?: string
  description?: string
}

export default async function FeaturedBundles({
  countryCode,
  limit = 4,
  title,
  description,
}: FeaturedBundlesProps) {
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)

  const displayTitle = title || t("bundles.featuredBundles")
  const displayDescription = description || t("bundles.featuredDescription")

  const region = await getRegion(countryCode)
  
  if (!region) {
    return null
  }

  const allBundles = await listBundleProducts(region.id, region.currency_code)
  const bundles = allBundles.slice(0, limit)

  if (!bundles || bundles.length === 0) {
    return null
  }

  return (
    <div className="content-container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level="h2" className="text-2xl font-medium mb-2">
            {displayTitle}
          </Heading>
          <Text className="text-ui-fg-subtle">{displayDescription}</Text>
        </div>
        {allBundles.length > limit && (
          <InteractiveLink href="/bundles">{t("bundles.viewAllBundles")}</InteractiveLink>
        )}
      </div>

      <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 large:grid-cols-4 gap-6">
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} region={region} />
        ))}
      </div>
    </div>
  )
}
