import { listBundleProducts } from "@lib/data/bundles"
import { getRegion } from "@lib/data/regions"
import { Heading, Text } from "@medusajs/ui"
import BundleCard from "@modules/products/components/bundle-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import InteractiveLink from "@modules/common/components/interactive-link"

type FeaturedBundlesProps = {
  countryCode: string
  limit?: number
  title?: string
  description?: string
}

export default async function FeaturedBundles({
  countryCode,
  limit = 4,
  title = "Featured Bundles",
  description = "Save money with our curated product bundles",
}: FeaturedBundlesProps) {
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
            {title}
          </Heading>
          <Text className="text-ui-fg-subtle">{description}</Text>
        </div>
        {allBundles.length > limit && (
          <InteractiveLink href="/bundles">View all bundles</InteractiveLink>
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
