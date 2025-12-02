import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { usePreorders } from "../hooks/use-preorders"
import { useTranslation } from "react-i18next"

const PreordersWidget = ({
  data: order
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const { t } = useTranslation()
  const { preorders, isLoading } = usePreorders(order.id)

  if (!preorders.length && !isLoading) {
    return <></>
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col justify-between py-4">
        <div className="flex flex-col gap-2 px-6">
          <Heading level="h2">
            {t("preorder.titlePlural")}
          </Heading>
          <Text className="text-ui-fg-muted" size="small">
            {t("preorder.willBeFulfilled")}
          </Text>
        </div>
        {isLoading && <div>{t("common.loading")}</div>}
        <div className="flex flex-col gap-4 pt-4 px-6">
          {preorders.map((preorder) => (
            <div key={preorder.id} className="flex items-center gap-2">
              {preorder.item.product_variant?.product?.thumbnail && <img 
                src={preorder.item.product_variant.product.thumbnail} 
                alt={preorder.item.product_variant.title || "Product Thumbnail"} 
                className="w-20 h-20 rounded-lg border"
              />}
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Text>{preorder.item.product_variant?.title || t("preorder.unnamedVariant")}</Text>
                  <StatusBadge color={getStatusBadgeColor(preorder.status)}>
                    {preorder.status === "fulfilled" ? t("common.fulfilled") : t("common.pending")}
                  </StatusBadge>
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("preorder.availableOn")}: {new Date(preorder.item.available_date).toLocaleDateString()}
                </Text>
                <Link to={`/products/${preorder.item.product_variant?.product_id}/variants/${preorder.item.variant_id}`}>
                  <Text size="small" className="text-ui-fg-interactive">
                    {t("preorder.viewProductVariant")}
                  </Text>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "fulfilled":
      return "green";
    case "pending":
      return "orange";
    default:
      return "grey";
  }
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default PreordersWidget