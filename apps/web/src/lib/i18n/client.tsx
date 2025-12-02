"use client"

import { createContext, useContext, ReactNode, useCallback } from "react"
import type { Dictionary } from "./dictionary"

type TranslateFunction = (key: string, params?: Record<string, string | number>) => string

interface TranslationContextType {
  dictionary: Dictionary
  t: TranslateFunction
  locale: string
}

const TranslationContext = createContext<TranslationContextType | null>(null)

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

interface TranslationProviderProps {
  children: ReactNode
  dictionary: Dictionary
  locale: string
}

export function TranslationProvider({ children, dictionary, locale }: TranslationProviderProps) {
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(dictionary, key)
    
    // Replace placeholders like {amount} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value))
      })
    }
    
    return translation
  }, [dictionary])

  return (
    <TranslationContext.Provider value={{ dictionary, t, locale }}>
      {children}
    </TranslationContext.Provider>
  )
}

/**
 * Hook to use translations in client components
 */
export function useTranslation() {
  const context = useContext(TranslationContext)
  
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  
  return context
}
