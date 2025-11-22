"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@modules/common/components/dialog"
import { MagnifyingGlassMini, XMark } from "@medusajs/icons"
import { debounce } from "@lib/util/debounce"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

interface SearchResult {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  categories?: Array<{ id: string; name: string; handle: string }>
  tags?: Array<{ id: string; value: string }>
}

interface SearchResponse {
  hits: SearchResult[]
  query: string
  processingTimeMs: number
  limit: number
  offset: number
  estimatedTotalHits: number
}

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
      setError(null)
      setSearchTime(0)
    }
  }, [isOpen])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearchTime(0)
      return
    }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery }),
        })

        if (!response.ok) {
          throw new Error("Search failed")
        }      const data: SearchResponse = await response.json()
      setResults(data.hits)
      setSearchTime(data.processingTimeMs)
    } catch (err) {
      setError("Failed to search products")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery)
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setQuery("")
    setResults([])
    setError(null)
    setSearchTime(0)
    inputRef.current?.focus()
  }

  const handleResultClick = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="sr-only">Search Products</DialogTitle>
          <div className="relative">
            <MagnifyingGlassMini className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-fg-muted" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for products..."
              value={query}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-fg-muted hover:text-ui-fg-base"
                aria-label="Clear search"
              >
                <XMark />
              </button>
            )}
          </div>
          {searchTime > 0 && (
            <div className="text-xs text-ui-fg-muted mt-2">
              Found {results.length} results in {searchTime}ms
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-fg-base"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {!isLoading && !error && query && results.length === 0 && (
            <div className="text-center py-8 text-ui-fg-muted">
              No products found for &quot;{query}&quot;
            </div>
          )}

          {!query && !isLoading && (
            <div className="text-center py-8 text-ui-fg-muted">
              Start typing to search for products...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((product) => (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  onClick={handleResultClick}
                  className="flex gap-4 p-3 rounded-lg hover:bg-ui-bg-subtle transition-colors"
                >
                  <div className="flex-shrink-0 w-20 h-20 bg-ui-bg-subtle rounded-lg overflow-hidden">
                    <Thumbnail
                      thumbnail={product.thumbnail}
                      size="square"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ui-fg-base truncate">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-ui-fg-muted line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                    {product.categories && product.categories.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {product.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.id}
                            className="text-xs px-2 py-1 bg-ui-bg-subtle rounded-md text-ui-fg-muted"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
