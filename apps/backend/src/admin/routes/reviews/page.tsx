import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { 
  createDataTableColumnHelper, 
  Container, 
  DataTable, 
  useDataTable, 
  Heading, 
  createDataTableCommandHelper, 
  DataTableRowSelectionState, 
  StatusBadge, 
  Toaster, 
  toast,
  DataTablePaginationState
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"
import { HttpTypes } from "@medusajs/framework/types"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

type Review = {
  id: string
  title?: string
  content: string
  rating: number
  product_id: string
  customer_id?: string
  status: "pending" | "approved" | "rejected"
  created_at: Date
  updated_at: Date
  product?: HttpTypes.AdminProduct
  customer?: HttpTypes.AdminCustomer
}


const columnHelper = createDataTableColumnHelper<Review>()

const commandHelper = createDataTableCommandHelper()

const limit = 15

const ReviewsPage = () => {
  const { t } = useTranslation()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0
  })
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({})

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading, refetch } = useQuery<{
    reviews: Review[]
    count: number
    limit: number
    offset: number
  }>({
    queryKey: ["reviews", offset, limit],
    queryFn: () => sdk.client.fetch("/admin/reviews", {
      query: {
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        order: "-created_at"
      }
    })
  })

  const columns = useMemo(() => [
    columnHelper.select(),
    columnHelper.accessor("id", {
      header: t("common.id"),
    }),
    columnHelper.accessor("title", {
      header: t("common.title"),
    }),
    columnHelper.accessor("rating", {
      header: t("reviews.rating"), 
    }),
    columnHelper.accessor("content", {
      header: t("reviews.content")
    }),
    columnHelper.accessor("status", {
      header: t("common.status"),
      cell: ({ row }) => {
        const status = row.original.status
        const color = status === "approved" ? "green" : status === "rejected" ? "red" : "grey"
        const label = status === "approved" ? t("reviews.approved") : 
                      status === "rejected" ? t("reviews.rejected") : t("common.pending")
        return (
          <StatusBadge color={color}>
            {label}
          </StatusBadge>
        )
      }
    }),
    columnHelper.accessor("product", {
      header: t("common.product"),
      cell: ({ row }) => {
        return (
          <Link
            to={`/products/${row.original.product_id}`}
          >
            {row.original.product?.title}
          </Link>
        )
      }
    }),
  ], [t])

  const commands = useMemo(() => [
    commandHelper.command({
      label: t("reviews.approve"),
      shortcut: "A",
      action: async (selection) => {
        const reviewsToApproveIds = Object.keys(selection)

        sdk.client.fetch("/admin/reviews/status", {
          method: "POST",
          body: {
            ids: reviewsToApproveIds,
            status: "approved"
          }
        }).then(() => {
          toast.success(t("reviews.approveSuccess"))
          refetch()
        }).catch(() => {
          toast.error(t("reviews.approveError"))
        })
      }
    }),
    commandHelper.command({
      label: t("reviews.reject"),
      shortcut: "R",
      action: async (selection) => {
        const reviewsToRejectIds = Object.keys(selection)

        sdk.client.fetch("/admin/reviews/status", {
          method: "POST",
          body: {
            ids: reviewsToRejectIds,
            status: "rejected"
          }
        }).then(() => {
          toast.success(t("reviews.rejectSuccess"))
          refetch()
        }).catch(() => {
          toast.error(t("reviews.rejectError"))
        })
      }
    })
  ], [t, refetch])

  const table = useDataTable({
    columns,
    data: data?.reviews || [],
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination
    },
    commands,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection
    },
    getRowId: (row) => row.id
  })

  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>
            {t("reviews.title")}
          </Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination translations={{
          of: t("general.of"),
          results: t("general.results"),
          pages: t("general.pages"),
          prev: t("general.prev"),
          next: t("general.next"),
        }} />
        <DataTable.CommandBar selectedLabel={(count) => t("reviews.selectedCount", { count })} />
      </DataTable>
      <Toaster />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reviews",
  icon: ChatBubbleLeftRight
})

export default ReviewsPage