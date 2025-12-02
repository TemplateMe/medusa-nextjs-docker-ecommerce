"use client"

import { useState } from "react"
import { MagnifyingGlass } from "@medusajs/icons"
import SearchModal from "../search-modal"
import { useTranslation } from "@lib/i18n"

export default function SearchButton() {
  const { t } = useTranslation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2 hover:text-ui-fg-base transition-colors"
        data-testid="nav-search-button"
        aria-label={t("nav.search")}
      >
        <MagnifyingGlass className="w-5 h-5" />
        <span className="hidden small:inline">{t("nav.search")}</span>
      </button>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
