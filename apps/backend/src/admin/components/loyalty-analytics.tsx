import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"
import { useTranslation } from "react-i18next"

type AnalyticsData = {
  total_points_issued: number
  average_points_per_customer: number
  total_customers_with_points: number
}

const LoyaltyAnalytics = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["loyalty-analytics"],
    queryFn: () => sdk.client.fetch("/admin/loyalty/analytics", {
      method: "GET",
    }),
  })

  if (isLoading) {
    return (
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="p-6">
        <Heading level="h3" className="mb-4">{t("loyalty.programOverview")}</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle mb-1">
              {t("loyalty.totalPointsIssued")}
            </Text>
            <Heading level="h2" className="text-ui-fg-base">
              {data?.total_points_issued.toLocaleString() || 0}
            </Heading>
          </div>
          
          <div className="p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle mb-1">
              {t("loyalty.averagePointsPerCustomer")}
            </Text>
            <Heading level="h2" className="text-ui-fg-base">
              {data?.average_points_per_customer.toLocaleString() || 0}
            </Heading>
          </div>
          
          <div className="p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle mb-1">
              {t("loyalty.customersWithPoints")}
            </Text>
            <Heading level="h2" className="text-ui-fg-base">
              {data?.total_customers_with_points.toLocaleString() || 0}
            </Heading>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default LoyaltyAnalytics