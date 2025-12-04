import { Locale, defaultLocale, isValidLocale } from "./config"

// Cache the dictionaries to avoid re-importing on every request
const dictionaries: Record<Locale, () => Promise<Record<string, any>>> = {
  en: () => import("./locales/en.json").then((module) => module.default),
  bg: () => import("./locales/bg.json").then((module) => module.default),
  it: () => import("./locales/it.json").then((module) => module.default),
}

/**
 * Get the dictionary for a specific locale
 * Used in Server Components
 */
export async function getDictionary(locale: Locale) {
  if (!isValidLocale(locale)) {
    return dictionaries[defaultLocale]()
  }
  return dictionaries[locale]()
}

/**
 * Type for the dictionary structure
 */
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".")
  let current: any = obj
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return path // Return the path as fallback
    }
    current = current[key]
  }
  
  return typeof current === "string" ? current : path
}

/**
 * Create a translation function from a dictionary
 */
export function createTranslator(dictionary: Dictionary) {
  return function t(key: string, params?: Record<string, string | number>): string {
    let translation = getNestedValue(dictionary, key)
    
    // Replace placeholders like {amount} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value))
      })
    }
    
    return translation
  }
}
