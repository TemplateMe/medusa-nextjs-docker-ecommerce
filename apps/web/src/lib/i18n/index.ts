// Config exports - safe for both server and client
export { locales, defaultLocale, getLocaleFromCountry, getLanguageName, getHtmlLang, isValidLocale, getCountriesForLocale } from "./config"
export type { Locale } from "./config"

// Dictionary exports - for server components
export { getDictionary, createTranslator } from "./dictionary"
export type { Dictionary } from "./dictionary"

// Client exports - for client components
export { TranslationProvider, useTranslation } from "./client"
