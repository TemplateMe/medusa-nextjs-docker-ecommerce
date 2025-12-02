import { listBundleProducts } from "@lib/data/bundles"
import { getRegion } from "@lib/data/regions"
import { Heading, Text } from "@medusajs/ui"
import BundleCard from "@modules/products/components/bundle-card"
import { getDictionary, getLocaleFromCountry, createTranslator } from "@lib/i18n"
import { Metadata } from "next"

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

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  
  return {
    title: dictionary.metadata.bundlesTitle,
    description: dictionary.metadata.bundlesDescription,
  }
}

export default async function BundlesPage(props: Props) {
  const params = await props.params
  const { countryCode } = params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)
  
  const region = await getRegion(countryCode)
  
  if (!region) {
    return null
  }

  const bundles = await listBundleProducts(region.id, region.currency_code)

  return (
    <div className="py-12">
      <div className="content-container">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <PackageIcon size={48} className="text-ui-fg-muted" />
          </div>
          <Heading level="h1" className="text-4xl font-bold mb-4">
            {t("bundles.title")}
          </Heading>
          <Text className="text-lg text-ui-fg-subtle max-w-2xl mx-auto">
            {t("metadata.bundlesDescription")}
          </Text>
        </div>

        {/* Bundles Grid */}
        {bundles && bundles.length > 0 ? (
          <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 large:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} region={region} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <PackageIcon size={64} className="text-ui-fg-muted mx-auto mb-4" />
            <Heading level="h2" className="text-2xl mb-2">
              {t("bundles.noBundlesAvailable")}
            </Heading>
            <Text className="text-ui-fg-subtle">
              {t("bundles.checkBackSoon")}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
