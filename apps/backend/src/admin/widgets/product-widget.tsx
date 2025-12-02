import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"
import { 
  DetailWidgetProps, 
  AdminProduct,
} from "@medusajs/framework/types"
import { useTranslation } from "react-i18next"

type WishlistResponse = {
  count: number
}

const ProductWidget = ({ 
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery<WishlistResponse>({
    queryFn: () => sdk.client.fetch(`/admin/products/${product.id}/wishlist`),
    queryKey: [["products", product.id, "wishlist"]],
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("wishlist.title")}</Heading>
      </div>
      <Text className="px-6 py-4">
        {isLoading ? 
          t("common.loading") : t("wishlist.inWishlistCount", { count: data?.count })
        }
      </Text>
    </Container>
  )
}


export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductWidget