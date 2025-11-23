import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StarRating from "@modules/products/components/star-rating"
import { getProductRatingStats } from "@lib/data/reviews"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = async ({ product }: ProductInfoProps) => {
  const ratingStats = await getProductRatingStats(product.id)

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {ratingStats.totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={ratingStats.averageRating} size="sm" />
            <span className="text-sm text-gray-600">
              {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalReviews}{" "}
              review{ratingStats.totalReviews !== 1 ? "s" : ""})
            </span>
            <a
              href="#reviews"
              className="text-sm text-blue-600 hover:underline ml-2"
            >
              See all reviews
            </a>
          </div>
        )}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
