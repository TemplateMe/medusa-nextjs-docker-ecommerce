import { getDictionary, getLocaleFromCountry, type Locale } from "@lib/i18n"
import { TranslationProvider } from "@lib/i18n/client"
import { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { locales } from "@lib/i18n"
import HtmlLangSetter from "@modules/common/components/html-lang-setter"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode)
  const dictionary = await getDictionary(locale)

  // Generate alternate language URLs for SEO
  const languages: Record<string, string> = {}
  locales.forEach((loc) => {
    // Map locale back to a country code for the URL
    // For bg locale, use bg country code; for en, use us
    const countryForLocale = loc === "bg" ? "bg" : "us"
    languages[loc] = `${getBaseURL()}/${countryForLocale}`
  })

  return {
    title: {
      template: `%s | ${dictionary.metadata.siteTitle}`,
      default: dictionary.metadata.siteTitle,
    },
    description: dictionary.metadata.siteDescription,
    alternates: {
      languages,
    },
    openGraph: {
      locale: locale,
      alternateLocale: locales.filter((l) => l !== locale),
    },
  }
}

export default async function CountryLayout({ children, params }: LayoutProps) {
  const { countryCode } = await params
  const locale = getLocaleFromCountry(countryCode) as Locale
  const dictionary = await getDictionary(locale)

  return (
    <TranslationProvider dictionary={dictionary} locale={locale}>
      <HtmlLangSetter />
      {children}
    </TranslationProvider>
  )
}
