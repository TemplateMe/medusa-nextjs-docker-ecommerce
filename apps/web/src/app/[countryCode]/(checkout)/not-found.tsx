import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"
import { getDictionary, createTranslator } from "@lib/i18n"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default async function NotFound() {
  const dictionary = await getDictionary("en")
  const t = createTranslator(dictionary)

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">{t("errors.notFound")}</h1>
      <p className="text-small-regular text-ui-fg-base">
        {t("errors.notFoundDescription")}
      </p>
      <InteractiveLink href="/">{t("errors.goToFrontpage")}</InteractiveLink>
    </div>
  )
}
