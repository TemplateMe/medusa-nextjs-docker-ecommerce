import { formatPreorderDate } from "@lib/util/preorder"

type PreorderBadgeProps = {
  availableDate: Date
  variant?: "default" | "small"
}

export default function PreorderBadge({
  availableDate,
  variant = "default",
}: PreorderBadgeProps) {
  const formattedDate = formatPreorderDate(availableDate)

  if (variant === "small") {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
        Pre-order
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-y-1">
      <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-800 rounded-md w-fit">
        Available for Pre-order
      </span>
      <span className="text-sm text-ui-fg-subtle">
        Expected: {formattedDate}
      </span>
    </div>
  )
}

