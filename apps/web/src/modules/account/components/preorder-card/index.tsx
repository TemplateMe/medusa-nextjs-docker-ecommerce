import { Preorder, PreorderStatus } from "../../../../types/preorder"
import { formatPreorderDate } from "@lib/util/preorder"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PreorderCardProps = {
  preorder: Preorder & {
    item: {
      product_variant?: {
        product?: {
          title?: string
          handle?: string
          thumbnail?: string
        }
        title?: string
        calculated_price?: {
          calculated_amount?: number
        }
      }
    }
  }
  countryCode: string
}

export default function PreorderCard({
  preorder,
  countryCode,
}: PreorderCardProps) {
  const product = preorder.item.product_variant?.product
  const variant = preorder.item.product_variant
  const availableDate = new Date(preorder.item.available_date)

  const getStatusBadge = (status: PreorderStatus) => {
    switch (status) {
      case PreorderStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case PreorderStatus.FULFILLED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Fulfilled
          </span>
        )
      case PreorderStatus.CANCELLED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-x-4">
        {product?.thumbnail && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={product.thumbnail}
              alt={product.title || "Product"}
              className="w-full h-full object-cover rounded"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {product?.handle ? (
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="text-base font-medium text-gray-900 hover:text-blue-600"
                >
                  {product.title || "Product"}
                </LocalizedClientLink>
              ) : (
                <h3 className="text-base font-medium text-gray-900">
                  {product?.title || "Product"}
                </h3>
              )}
              
              {variant?.title && (
                <p className="text-sm text-gray-500 mt-1">
                  Variant: {variant.title}
                </p>
              )}
              
              {variant?.calculated_price?.calculated_amount !== undefined && (
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {convertToLocale({
                    amount: variant.calculated_price.calculated_amount,
                    currency_code: "usd",
                  })}
                </p>
              )}
            </div>
            
            <div className="ml-4">
              {getStatusBadge(preorder.status)}
            </div>
          </div>
          
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <svg
              className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Expected: {formatPreorderDate(availableDate)}</span>
          </div>
          
          {preorder.order_id && (
            <div className="mt-2">
              <LocalizedClientLink
                href={`/account/orders/details/${preorder.order_id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Order →
              </LocalizedClientLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

