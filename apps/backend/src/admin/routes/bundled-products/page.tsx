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

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("title", {
    header: "Title",
  }),
  columnHelper.accessor("items", {
    header: "Items",
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
    header: "Product",
    cell: ({ row }) => {
      return <Link to={`/products/${row.original.product?.id}`}>View Product</Link>
    },
  }),
]

const limit = 15

const BundledProductsPage = () => {
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
      toast.success("Bundle deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["bundled-products"] })
      refetch()
    },
    onError: () => {
      toast.error("Failed to delete bundle")
    },
  })

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await prompt({
      title: "Delete Bundle",
      description: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const columnsWithActions = useMemo(() => [
    ...columns,
    columnHelper.display({
      id: "actions",
      header: "Actions",
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
  ], [])

  const table = useDataTable({
    columns: columnsWithActions,
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
          <Heading>Bundled Products</Heading>
          <CreateBundledProduct />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bundled Products",
  icon: CubeSolid,
})

export default BundledProductsPage
