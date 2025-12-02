"use client"

import { Container, Heading, Text } from "@medusajs/ui"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@lib/i18n/client"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const { t } = useTranslation()
  const payment = order.payment_collections?.[0].payments?.[0]

  // Format date consistently to avoid hydration mismatch
  const formatPaymentDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return ""
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    // Use ISO format which is consistent across server/client
    return date.toISOString().split('T')[0] + ' ' + date.toISOString().split('T')[1].split('.')[0]
  }

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        {t("orders.payment")}
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t("orders.paymentMethod")}
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t("orders.paymentDetails")}
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount" suppressHydrationWarning>
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : t("orders.paidAt", {
                        amount: convertToLocale({
                          amount: payment.amount,
                          currency_code: order.currency_code,
                        }),
                        date: formatPaymentDate(payment.created_at),
                      })}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
