import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CubeSolid, Trash } from "@medusajs/icons"
import { 
  Container,
  Heading,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  DataTablePaginationState,
  IconButton,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"
import { Link } from "react-router-dom"
import CreateBundledProduct from "../../components/create-bundled-product"
import { useTranslation } from "react-i18next"

type BundledProduct = {
  id: string
  title: string
  product: {
    id: string
  }
  items: {
    id: string
    product: {
      id: string
      title: string
    }
    quantity: number
  }[]
  created_at: Date
  updated_at: Date
}

const columnHelper = createDataTableColumnHelper<BundledProduct>()

const limit = 15

const BundledProductsPage = () => {
  const { t } = useTranslation()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading, refetch } = useQuery<{
    bundled_products: BundledProduct[]
    count: number
  }>({
    queryKey: ["bundled-products", offset, limit],
    queryFn: () => sdk.client.fetch("/admin/bundled-products", {
      method: "GET",
      query: {
        limit,
        offset,
      },
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return sdk.client.fetch(`/admin/bundled-products/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      toast.success(t("bundles.deleteSuccess"))
      queryClient.invalidateQueries({ queryKey: ["bundled-products"] })
      refetch()
    },
    onError: () => {
      toast.error(t("bundles.deleteError"))
    },
  })

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await prompt({
      title: t("bundles.deleteBundle"),
      description: t("bundles.deleteConfirm", { title }),
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: t("common.id"),
    }),
    columnHelper.accessor("title", {
      header: t("common.title"),
    }),
    columnHelper.accessor("items", {
      header: t("bundles.items"),
      cell: ({ row }) => {
        return row.original.items.map((item) => (
          <div key={item.id}>
            <Link to={`/products/${item.product.id}`}>
              {item.product.title}
            </Link>{" "}
            x {item.quantity}
          </div>
        ))
      },
    }),
    columnHelper.accessor("product", {
      header: t("common.product"),
      cell: ({ row }) => {
        return <Link to={`/products/${row.original.product?.id}`}>{t("bundles.viewProduct")}</Link>
      },
    }),
    columnHelper.display({
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <IconButton
              variant="transparent"
              size="small"
              onClick={() => handleDelete(row.original.id, row.original.title)}
            >
              <Trash />
            </IconButton>
          </div>
        )
      },
    }),
  ], [t])

  const table = useDataTable({
    columns,
    data: data?.bundled_products ?? [],
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    rowCount: data?.count ?? 0,
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>{t("bundles.title")}</Heading>
          <CreateBundledProduct />
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
  label: "Bundled Products",
  icon: CubeSolid,
})

export default BundledProductsPage
