"use client"

import { useState } from "react"
import { MagnifyingGlass } from "@medusajs/icons"
import SearchModal from "../search-modal"

export default function SearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2 hover:text-ui-fg-base transition-colors"
        data-testid="nav-search-button"
        aria-label="Search products"
      >
        <MagnifyingGlass className="w-5 h-5" />
        <span className="hidden small:inline">Search</span>
      </button>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
