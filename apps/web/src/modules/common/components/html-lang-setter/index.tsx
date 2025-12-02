"use client"

import { useEffect } from "react"
import { useTranslation } from "@lib/i18n/client"
import { getHtmlLang } from "@lib/i18n/config"
import type { Locale } from "@lib/i18n/config"

/**
 * Client component that sets the HTML lang attribute based on current locale
 * This runs on the client side after hydration
 */
export function HtmlLangSetter() {
  const { locale } = useTranslation()

  useEffect(() => {
    if (typeof document !== "undefined") {
      const htmlLang = getHtmlLang(locale as Locale)
      document.documentElement.lang = htmlLang
    }
  }, [locale])

  return null
}

export default HtmlLangSetter
