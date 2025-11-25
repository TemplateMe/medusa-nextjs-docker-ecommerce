import { getBundleProduct } from "@lib/data/bundles"
import { getRegion } from "@lib/data/regions"
import { notFound } from "next/navigation"
import BundleDetail from "@modules/products/components/bundle-detail"
import ImageGallery from "@modules/products/components/image-gallery"
import { Metadata } from "next"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { id, countryCode } = params
  const region = await getRegion(countryCode)
  const bundle = await getBundleProduct(id, region?.id, region?.currency_code)

  if (!bundle) {
    return {
      title: "Bundle Not Found",
    }
  }

  return {
    title: bundle.title,
    description: `Bundle package with ${bundle.items.length} items`,
  }
}

export default async function BundlePage(props: Props) {
  const params = await props.params
  const { countryCode, id } = params
  
  const region = await getRegion(countryCode)
  const bundle = await getBundleProduct(id, region?.id, region?.currency_code)

  if (!bundle || !region) {
    return notFound()
  }

  // Get images from the bundle's main product
  const images = bundle.product?.images || []

  return (
    <div className="py-6">
      <div className="content-container">
        <div className="flex flex-col small:flex-row small:items-start gap-8">
          {/* Image Gallery */}
          <div className="w-full small:w-1/2">
            {images.length > 0 ? (
              <ImageGallery images={images} />
            ) : (
              <div className="aspect-square bg-ui-bg-subtle rounded-lg flex items-center justify-center">
                <span className="text-ui-fg-muted">No image available</span>
              </div>
            )}
          </div>

          {/* Bundle Details */}
          <div className="w-full small:w-1/2">
            <BundleDetail
              bundle={bundle}
              region={region}
              countryCode={countryCode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
