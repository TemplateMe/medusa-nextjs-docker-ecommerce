"use client"

import { formatPreorderDate } from "@lib/util/preorder"
import { useTranslation } from "@lib/i18n"

type PreorderBadgeProps = {
  availableDate: Date
  variant?: "default" | "small"
}

export default function PreorderBadge({
  availableDate,
  variant = "default",
}: PreorderBadgeProps) {
  const { t } = useTranslation()
  const formattedDate = formatPreorderDate(availableDate)

  if (variant === "small") {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
        {t("products.preorder")}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-y-1">
      <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-800 rounded-md w-fit">
        {t("products.preorderAvailable")}
      </span>
      <span className="text-sm text-ui-fg-subtle">
        {t("products.expectedDate", { date: formattedDate })}
      </span>
    </div>
  )
}

