// Supported locales
export const locales = ["en", "bg"] as const
export type Locale = (typeof locales)[number]

// Default locale fallback
export const defaultLocale: Locale = "en"

// Country code to locale mapping
// Based on Medusa region country codes
export const countryToLocaleMap: Record<string, Locale> = {
  // Bulgarian locale
  bg: "bg",
  
  // English locale (default for most countries)
  us: "en",
  gb: "en",
  uk: "en",
  ca: "en",
  au: "en",
  nz: "en",
  ie: "en",
  sg: "en",
  hk: "en",
  ph: "en",
  in: "en",
  za: "en",
  ng: "en",
  ke: "en",
  gh: "en",
  
  // European countries default to English unless specified
  de: "en",
  fr: "en",
  it: "en",
  es: "en",
  nl: "en",
  be: "en",
  at: "en",
  ch: "en",
  pl: "en",
  cz: "en",
  sk: "en",
  hu: "en",
  ro: "en",
  hr: "en",
  si: "en",
  rs: "en",
  mk: "en",
  al: "en",
  gr: "en",
  cy: "en",
  pt: "en",
  dk: "en",
  se: "en",
  no: "en",
  fi: "en",
  ee: "en",
  lv: "en",
  lt: "en",
  
  // Asian countries
  jp: "en",
  kr: "en",
  cn: "en",
  tw: "en",
  th: "en",
  vn: "en",
  my: "en",
  id: "en",
  
  // South American countries
  br: "en",
  ar: "en",
  cl: "en",
  co: "en",
  pe: "en",
  mx: "en",
  
  // Middle East
  ae: "en",
  sa: "en",
  il: "en",
  tr: "en",
}

/**
 * Get locale from country code
 * Falls back to default locale (English) if country not mapped
 */
export function getLocaleFromCountry(countryCode: string): Locale {
  const normalizedCode = countryCode.toLowerCase()
  return countryToLocaleMap[normalizedCode] || defaultLocale
}

/**
 * Get language name for display
 */
export function getLanguageName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: "English",
    bg: "Български",
  }
  return names[locale]
}

/**
 * Get language code for HTML lang attribute
 */
export function getHtmlLang(locale: Locale): string {
  return locale
}

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/**
 * Get all supported country codes for a locale
 */
export function getCountriesForLocale(locale: Locale): string[] {
  return Object.entries(countryToLocaleMap)
    .filter(([_, loc]) => loc === locale)
    .map(([country]) => country)
}
