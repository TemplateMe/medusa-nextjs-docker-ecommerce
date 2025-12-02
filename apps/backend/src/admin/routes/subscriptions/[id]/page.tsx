import { 
  Container,
  Heading,
  Table
} from "@medusajs/ui"
import { useParams, Link } from "react-router-dom"
import { SubscriptionData } from "../../../types/index.js"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../../lib/sdk.js"
import { useTranslation } from "react-i18next"

const SubscriptionPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data, isLoading } = useQuery<{
    subscription: SubscriptionData
  }>({
    queryFn: () => sdk.client.fetch(`/admin/subscriptions/${id}`),
    queryKey: ["subscription", id],
  })

  return (
    <Container>
      {isLoading && <span>{t("common.loading")}</span>}
      {data?.subscription && (
        <>
          <Heading level="h1">{t("subscriptions.ordersOfSubscription", { id: data.subscription.id })}</Heading>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>#</Table.HeaderCell>
                <Table.HeaderCell>{t("common.date")}</Table.HeaderCell>
                <Table.HeaderCell>{t("subscriptions.viewOrder")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.subscription.orders?.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>{order.id}</Table.Cell>
                  <Table.Cell>{(new Date(order.created_at)).toDateString()}</Table.Cell>
                  <Table.Cell>
                    <Link to={`/orders/${order.id}`}>
                      {t("subscriptions.viewOrder")}
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </Container>
  )
}

export default SubscriptionPage
