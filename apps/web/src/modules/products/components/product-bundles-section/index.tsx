import { getBundlesForProduct } from "@lib/data/bundles"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import BundleCard from "@modules/products/components/bundle-card"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

type ProductBundlesSectionProps = {
  productId: string
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default async function ProductBundlesSection({
  productId,
  region,
  countryCode,
}: ProductBundlesSectionProps) {
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)
  const bundles = await getBundlesForProduct(productId, region.id, region.currency_code)

  if (!bundles || bundles.length === 0) {
    return null
  }

  return (
    <div className="content-container my-16">
      <div className="mb-8">
        <Heading level="h2" className="text-2xl font-medium">
          {t("bundles.availableInBundles")}
        </Heading>
        <p className="text-ui-fg-subtle mt-2">
          {t("bundles.saveMoney")}
        </p>
      </div>
      
      <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6">
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} region={region} />
        ))}
      </div>
    </div>
  )
}
