import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"
import { retrieveWishlist } from "@lib/data/wishlist"
import { retrieveCustomer } from "@lib/data/customer"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Also fetches wishlist data if customer is authenticated.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  // Fetch customer and wishlist data
  const customer = await retrieveCustomer()
  const wishlist = customer ? await retrieveWishlist() : null

  return (
    <ProductActions
      product={product}
      region={region}
      wishlist={wishlist}
      isAuthenticated={!!customer}
    />
  )
}
