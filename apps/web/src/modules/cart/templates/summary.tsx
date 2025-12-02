"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import LoyaltyPointsWidget from "@modules/cart/components/loyalty-points-widget"
import { useTranslation } from "@lib/i18n"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  loyaltyPoints?: number
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, loyaltyPoints = 0 }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        {t("cart.summary")}
      </Heading>
      <DiscountCode cart={cart} />
      {loyaltyPoints > 0 && (
        <>
          <Divider />
          <LoyaltyPointsWidget cart={cart} loyaltyPoints={loyaltyPoints} />
        </>
      )}
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">{t("cart.checkout")}</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
