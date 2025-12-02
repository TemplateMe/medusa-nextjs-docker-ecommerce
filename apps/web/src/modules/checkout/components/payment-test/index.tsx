"use client"

import { Badge } from "@medusajs/ui"
import { useTranslation } from "@lib/i18n"

const PaymentTest = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">{t("checkout.attention")}:</span> {t("checkout.forTestingPurposes")}
    </Badge>
  )
}

export default PaymentTest
