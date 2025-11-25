import { getBundlesForProduct } from "@lib/data/bundles"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import BundleCard from "@modules/products/components/bundle-card"

type ProductBundlesSectionProps = {
  productId: string
  region: HttpTypes.StoreRegion
}

export default async function ProductBundlesSection({
  productId,
  region,
}: ProductBundlesSectionProps) {
  const bundles = await getBundlesForProduct(productId, region.id, region.currency_code)

  if (!bundles || bundles.length === 0) {
    return null
  }

  return (
    <div className="content-container my-16">
      <div className="mb-8">
        <Heading level="h2" className="text-2xl font-medium">
          Available in Bundles
        </Heading>
        <p className="text-ui-fg-subtle mt-2">
          Save money by purchasing this product as part of a bundle
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
