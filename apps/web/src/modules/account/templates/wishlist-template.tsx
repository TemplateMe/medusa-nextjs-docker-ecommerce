"use client"

import { Heading, Button, Text, Container } from "@medusajs/ui"
import WishlistItem from "../components/wishlist-item"
import { useState } from "react"
import { getWishlistShareToken } from "@lib/data/wishlist"
import { Wishlist } from "@lib/data/wishlist"

type WishlistTemplateProps = {
  wishlist: Wishlist | null
  countryCode: string
}

/**
 * Template component for displaying the customer's wishlist
 * Includes share functionality and list of wishlist items
 */
export default function WishlistTemplate({
  wishlist,
  countryCode,
}: WishlistTemplateProps) {
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const { token } = await getWishlistShareToken()
      setShareToken(token)
    } catch (error) {
      console.error("Failed to generate share token:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = () => {
    if (shareToken) {
      const shareUrl = `${window.location.origin}/${countryCode}/wishlist/${shareToken}`
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // If no wishlist exists yet, show empty state
  if (!wishlist) {
    return (
      <div className="flex flex-col gap-y-4" data-testid="wishlist-empty">
        <div>
          <Heading level="h1" className="text-2xl-semi mb-2">
            My Wishlist
          </Heading>
          <Text className="text-base-regular text-ui-fg-subtle">
            Your wishlist is empty
          </Text>
        </div>
        <div>
          <Text className="text-base-regular">
            Start adding items to your wishlist to save them for later.
          </Text>
        </div>
      </div>
    )
  }

  const items = wishlist.items || []

  return (
    <div className="flex flex-col gap-y-8" data-testid="wishlist-page">
      {/* Header with Share Button */}
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <Heading level="h1" className="text-2xl-semi">
            My Wishlist
          </Heading>
          {items.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleShare}
              isLoading={isSharing}
              disabled={isSharing}
              data-testid="share-wishlist-button"
            >
              Share Wishlist
            </Button>
          )}
        </div>
        
        {/* Share Link Display */}
        {shareToken && (
          <div className="bg-ui-bg-subtle p-4 rounded-lg flex flex-col gap-y-2">
            <Text className="text-small-regular text-ui-fg-subtle">
              Share this link with others to show them your wishlist:
            </Text>
            <div className="flex gap-x-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/${countryCode}/wishlist/${shareToken}`}
                className="flex-1 px-3 py-2 text-small-regular border border-ui-border-base rounded-md bg-ui-bg-base"
                data-testid="share-link-input"
              />
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                data-testid="copy-link-button"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <Text className="text-base-regular text-ui-fg-subtle">
            {items.length} {items.length === 1 ? "item" : "items"} in your
            wishlist
          </Text>
        )}
      </div>

      {/* Wishlist Items */}
      {items.length === 0 ? (
        <div>
          <Text className="text-base-regular text-ui-fg-subtle">
            Your wishlist is empty. Start adding items to save them for later.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="pb-4 border-b border-gray-200 last:border-b-0"
            >
              <WishlistItem item={item} countryCode={countryCode} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

