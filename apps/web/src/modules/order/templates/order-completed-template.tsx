import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import OrderLoyaltyPoints from "@modules/order/components/order-loyalty-points"
import { HttpTypes } from "@medusajs/types"
import { getLoyaltyPoints } from "@lib/data/loyalty"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
  countryCode: string
}

export default async function OrderCompletedTemplate({
  order,
  countryCode,
}: OrderCompletedTemplateProps) {
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  
  // Get loyalty points if customer exists
  let loyaltyPoints = 0
  
  if (order.customer_id) {
    try {
      loyaltyPoints = await getLoyaltyPoints()
    } catch (error) {
      // If error fetching points, default to 0
      loyaltyPoints = 0
    }
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>{t("orders.thankYou")}</span>
            <span>{t("orders.orderPlaced")}</span>
          </Heading>
          {loyaltyPoints > 0 && (
            <OrderLoyaltyPoints order={order as any} loyaltyPoints={loyaltyPoints} />
          )}
          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            {t("cart.summary")}
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
