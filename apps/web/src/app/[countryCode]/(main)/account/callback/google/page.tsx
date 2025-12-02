"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { handleGoogleCallback } from "@lib/data/google-auth"
import { useTranslation } from "@lib/i18n"

export default function GoogleCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const validateCallback = async () => {
      try {
        console.log("[Callback Page] Starting validation...")
        
        // Get all query parameters from the callback
        const queryParams: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          queryParams[key] = value
        })

        console.log("[Callback Page] Query params:", queryParams)

        if (Object.keys(queryParams).length === 0) {
          throw new Error("No callback parameters received")
        }

        // Call server action to handle the callback
        console.log("[Callback Page] Calling handleGoogleCallback...")
        const result = await handleGoogleCallback(queryParams)
        console.log("[Callback Page] Result:", result)

        if (!result.success) {
          throw new Error(result.error || "Authentication failed")
        }

        console.log("[Callback Page] Success! Redirecting...")
        
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500))

        // Redirect to account page
        router.push("/account")
      } catch (err) {
        console.error("[Callback Page] Error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")
        setLoading(false)
      }
    }

    validateCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-ui-fg-base">
        <div className="flex flex-col gap-y-4 items-center max-w-md text-center">
          <h1 className="text-2xl-semi">{t("account.authenticationFailed")}</h1>
          <p className="text-base-regular text-ui-fg-subtle">{error}</p>
          <button
            onClick={() => router.push("/account")}
            className="btn-primary mt-4 px-6 py-2 bg-ui-fg-base text-ui-bg-base rounded-rounded hover:bg-ui-fg-subtle transition-colors"
          >
            {t("account.returnToLogin")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-ui-fg-base">
      <div className="flex flex-col gap-y-4 items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-base"></div>
        <p className="text-base-regular">
          {loading ? t("account.completingAuthentication") : t("account.redirecting")}
        </p>
      </div>
    </div>
  )
}
