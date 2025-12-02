"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { useTranslation } from "@lib/i18n/client"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const { t } = useTranslation()

  const sortOptions = [
    {
      value: "created_at",
      label: t("store.latestArrivals"),
    },
    {
      value: "price_asc",
      label: t("store.priceLowToHigh"),
    },
    {
      value: "price_desc",
      label: t("store.priceHighToLow"),
    },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title={t("products.sortBy")}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
