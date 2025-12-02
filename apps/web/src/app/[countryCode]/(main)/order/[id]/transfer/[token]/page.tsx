import { Heading, Text } from "@medusajs/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string; countryCode: string }>
}) {
  const { id, token, countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          {t("orders.transferRequestTitle", { orderId: id })}
        </Heading>
        <Text className="text-zinc-600">
          {t("orders.transferRequestDescription", { orderId: id })}
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          {t("orders.transferAcceptNote")}
        </Text>
        <Text className="text-zinc-600">
          {t("orders.transferDeclineNote")}
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
