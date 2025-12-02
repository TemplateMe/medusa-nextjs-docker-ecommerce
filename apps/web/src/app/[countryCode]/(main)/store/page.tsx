import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { getDictionary, getLocaleFromCountry } from "@lib/i18n"

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  
  return {
    title: dictionary.metadata.productsTitle,
    description: dictionary.metadata.productsDescription,
  }
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
