import { Preorder } from "../../../types/preorder"
import PreorderCard from "../components/preorder-card"

type PreordersTemplateProps = {
  preorders: Preorder[]
  countryCode: string
}

export default function PreordersTemplate({
  preorders,
  countryCode,
}: PreordersTemplateProps) {
  if (!preorders || preorders.length === 0) {
    return (
      <div className="w-full" data-testid="preorders-page-empty">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No pre-orders
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't placed any pre-orders yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" data-testid="preorders-page">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Pre-orders</h1>
        <p className="text-base-regular">
          View and manage your pre-ordered items. You'll be notified when they
          become available.
        </p>
      </div>
      
      <div className="flex flex-col gap-y-4">
        {preorders.map((preorder) => (
          <PreorderCard
            key={preorder.id}
            preorder={preorder as any}
            countryCode={countryCode}
          />
        ))}
      </div>
    </div>
  )
}

