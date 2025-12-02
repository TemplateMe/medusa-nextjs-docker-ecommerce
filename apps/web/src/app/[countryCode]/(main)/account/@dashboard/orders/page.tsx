import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import { retrieveCustomer } from "@lib/data/customer"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export const dynamic = "force-dynamic"

export default async function Orders({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  // Check if customer is authenticated first
  const customer = await retrieveCustomer().catch(() => null)
  
  if (!customer) {
    notFound()
  }
  
  const orders = await listOrders().catch(() => null)

  if (!orders) {
    notFound()
  }

  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{t("orders.title")}</h1>
        <p className="text-base-regular">
          {t("orders.ordersDescription")}
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <Divider className="my-16" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
