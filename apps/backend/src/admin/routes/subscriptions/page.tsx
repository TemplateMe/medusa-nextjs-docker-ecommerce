import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ClockSolid } from "@medusajs/icons"
import { Container, Heading, Badge, createDataTableColumnHelper, useDataTable, DataTablePaginationState, DataTable } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { SubscriptionData, SubscriptionStatus } from "../../types"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

const columnHelper = createDataTableColumnHelper<SubscriptionData>()

const SubscriptionsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 4,
    pageIndex: 0,
  })

  const query = useMemo(() => {
    return new URLSearchParams({
      limit: `${pagination.pageSize}`,
      offset: `${pagination.pageIndex * pagination.pageSize}`,
    })
  }, [pagination])

  const { data, isLoading } = useQuery<{
    subscriptions: SubscriptionData[],
    count: number
  }>({
    queryFn: () => sdk.client.fetch(`/admin/subscriptions?${query.toString()}`),
    queryKey: ["subscriptions", query.toString()],
  })

  const getBadgeColor = (status: SubscriptionStatus) => {
    switch(status) {
      case SubscriptionStatus.CANCELED:
        return "orange"
      case SubscriptionStatus.FAILED:
        return "red"
      case SubscriptionStatus.EXPIRED:
        return "grey"
      default:
        return "green"
    }
  }

  const getStatusTitle = (status: SubscriptionStatus) => {
    switch(status) {
      case SubscriptionStatus.CANCELED:
        return t("subscriptions.canceled")
      case SubscriptionStatus.FAILED:
        return t("subscriptions.failed")
      case SubscriptionStatus.EXPIRED:
        return t("subscriptions.expired")
      default:
        return t("subscriptions.active")
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "#",
    }),
    columnHelper.accessor("metadata.main_order_id", {
      header: t("subscriptions.mainOrder"),
    }),
    columnHelper.accessor("customer.email", {
      header: t("common.customer")
    }),
    columnHelper.accessor("subscription_date", {
      header: t("subscriptions.subscriptionDate"),
      cell: ({ getValue }) => {
        return getValue().toLocaleString()
      }
    }),
    columnHelper.accessor("expiration_date", {
      header: t("subscriptions.expiryDate"),
      cell: ({ getValue }) => {
        return getValue().toLocaleString()
      }
    }),
    columnHelper.accessor("status", {
      header: t("common.status"),
      cell: ({ getValue }) => {
        return (
          <Badge color={getBadgeColor(getValue())}>
            {getStatusTitle(getValue())}
          </Badge>
        )
      }
    }),
  ], [t])

  const table = useDataTable({
    columns,
    data: data?.subscriptions || [],
    getRowId: (subscription) => subscription.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick(_event, row) {
      navigate(`/subscriptions/${row.id}`)
    },
  })


  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar>
          <Heading level="h1">{t("subscriptions.title")}</Heading>
        </DataTable.Toolbar>
				<DataTable.Table />
        <DataTable.Pagination translations={{
          of: t("general.of"),
          results: t("general.results"),
          pages: t("general.pages"),
          prev: t("general.prev"),
          next: t("general.next"),
        }} />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscriptions",
  icon: ClockSolid,
})

export default SubscriptionsPage
