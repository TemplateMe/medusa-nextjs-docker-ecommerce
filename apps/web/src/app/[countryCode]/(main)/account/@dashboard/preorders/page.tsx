import { Metadata } from "next"
import { retrieveCustomerPreorders } from "@lib/data/preorder"
import PreordersTemplate from "@modules/account/templates/preorders-template"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Pre-orders",
  description: "View your pre-ordered items",
}

export default async function Preorders({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  
  const preorders = await retrieveCustomerPreorders()

  if (!preorders) {
    notFound()
  }

  return <PreordersTemplate preorders={preorders} countryCode={countryCode} />
}

