import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getDictionary, getLocaleFromCountry } from "@lib/i18n"

interface HomeProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  
  return {
    title: dictionary.metadata.homeTitle,
    description: dictionary.metadata.homeDescription,
  }
}

export default async function Home({ params }: HomeProps) {
  const { countryCode } = await params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
