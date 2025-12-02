import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDictionary, getLocaleFromCountry } from "@lib/i18n"

interface CartPageProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  
  return {
    title: dictionary.metadata.cartTitle,
    description: dictionary.metadata.cartDescription,
  }
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
