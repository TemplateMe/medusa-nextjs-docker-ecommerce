import { declineTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@medusajs/ui"
import TransferImage from "@modules/order/components/transfer-image"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string; countryCode: string }>
}) {
  const { id, token, countryCode } = await params

  const { success, error } = await declineTransferRequest(id, token)
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-zinc-900">
              {t("orders.orderTransferDeclined")}
            </Heading>
            <Text className="text-zinc-600">
              {t("orders.orderTransferDeclinedDescription", { orderId: id })}
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-zinc-600">
              {t("orders.transferDeclineError")}
            </Text>
            {error && (
              <Text className="text-red-500">{t("errors.errorMessage", { message: error })}</Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}
