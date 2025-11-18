import { Metadata } from "next"
import { retrieveWishlist } from "@lib/data/wishlist"
import WishlistTemplate from "@modules/account/templates/wishlist-template"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your wishlist.",
}

/**
 * Account wishlist page
 * Displays the authenticated customer's wishlist with management options
 */
export default async function WishlistPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const wishlist = await retrieveWishlist()

  return <WishlistTemplate wishlist={wishlist} countryCode={countryCode} />
}

