import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string; countryCode: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const { id, countryCode } = params
  
  let order = null
  try {
    order = await retrieveOrder(id)
  } catch (error) {
    console.error("Failed to retrieve order:", id, error)
    return notFound()
  }

  if (!order) {
    console.error("Order not found:", id)
    return notFound()
  }

  return <OrderCompletedTemplate order={order} countryCode={countryCode} />
}
