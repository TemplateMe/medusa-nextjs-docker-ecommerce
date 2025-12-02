import { Button, Container, Text } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"
import { getDictionary, createTranslator, getLocaleFromCountry } from "@lib/i18n"

type ProductOnboardingCtaProps = {
  countryCode: string
}

async function ProductOnboardingCta({ countryCode }: ProductOnboardingCtaProps) {
  const cookies = await nextCookies()
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)
  const t = createTranslator(dictionary)

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full p-8">
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ui-fg-base text-xl">
          {t("products.demoProductCreated")}
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          {t("products.continueSetupMessage")}
        </Text>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">{t("products.continueSetupAdmin")}</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta
