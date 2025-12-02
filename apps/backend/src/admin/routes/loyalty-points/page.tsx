import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { 
  Container,
  Heading,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  DataTablePaginationState,
  Text,
  toast,
  Badge,
  Button,
  Tabs,
  Input,
  Label,
  Switch,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, useEffect } from "react"
import { sdk } from "../../lib/sdk"
import { Link } from "react-router-dom"
import AdjustPointsDialog from "../../components/adjust-points-dialog.tsx"
import LoyaltyAnalytics from "../../components/loyalty-analytics.tsx"
import { useTranslation } from "react-i18next"

type LoyaltyPoint = {
  id: string
  customer_id: string
  points: number
  created_at: Date
  updated_at: Date
  customer?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

type LoyaltyConfig = {
  id: string
  earning_rate: number
  min_order_amount: number
  earning_enabled: boolean
  redemption_rate: number
  min_points_redemption: number
  max_points_per_order: number | null
  redemption_enabled: boolean
  is_active: boolean
}

const columnHelper = createDataTableColumnHelper<LoyaltyPoint>()

const limit = 20

const LoyaltyPointsPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyPoint | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<LoyaltyConfig>>({})

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading, refetch } = useQuery<{
    loyalty_points: LoyaltyPoint[]
    count: number
    limit: number
    offset: number
  }>({
    queryKey: ["loyalty-points", offset, limit],
    queryFn: () => sdk.client.fetch("/admin/loyalty", {
      method: "GET",
      query: {
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      }
    }),
  })

  const { data: configData, isLoading: isConfigLoading } = useQuery<{ config: LoyaltyConfig }>({
    queryKey: ["loyalty-config"],
    queryFn: () => sdk.client.fetch("/admin/loyalty/config", {
      method: "GET",
    }),
  })

  useEffect(() => {
    if (configData?.config) {
      setFormData(configData.config)
    }
  }, [configData])

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<LoyaltyConfig>) => {
      return sdk.client.fetch("/admin/loyalty/config/update", {
        method: "POST",
        body: updates,
      })
    },
    onSuccess: () => {
      toast.success(t("loyalty.configSaveSuccess"))
      queryClient.invalidateQueries({ queryKey: ["loyalty-config"] })
    },
    onError: (error: any) => {
      toast.error(error.message || t("loyalty.configSaveError"))
    },
  })

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: t("common.id"),
      cell: ({ row }) => {
        return <Text size="small" className="font-mono">{row.original.id.slice(0, 8)}...</Text>
      }
    }),
    columnHelper.accessor("customer", {
      header: t("common.customer"),
      cell: ({ row }) => {
        const customer = row.original.customer
        const name = customer?.first_name && customer?.last_name 
          ? `${customer.first_name} ${customer.last_name}`
          : customer?.email || "Unknown"
        
        return (
          <Link
            to={`/customers/${row.original.customer_id}`}
            className="text-blue-600 hover:underline"
          >
            {name}
          </Link>
        )
      }
    }),
    columnHelper.accessor("customer.email", {
      header: t("loyalty.email"),
      cell: ({ row }) => {
        return <Text size="small">{row.original.customer?.email || "N/A"}</Text>
      }
    }),
    columnHelper.accessor("points", {
      header: t("loyalty.points"),
      cell: ({ row }) => {
        const points = row.original.points
        const color = points > 1000 ? "green" : points > 500 ? "blue" : "grey"
        return (
          <Badge color={color} size="small">
            {points.toLocaleString()} pts
          </Badge>
        )
      }
    }),
    columnHelper.accessor("updated_at", {
      header: t("common.date"),
      cell: ({ row }) => {
        return (
          <Text size="small">
            {new Date(row.original.updated_at).toLocaleDateString()}
          </Text>
        )
      }
    }),
    columnHelper.display({
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => {
        return (
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setSelectedCustomer(row.original)
              setIsAdjustDialogOpen(true)
            }}
          >
            {t("loyalty.adjust")}
          </Button>
        )
      },
    }),
  ], [t])

  const table = useDataTable({
    columns,
    data: data?.loyalty_points ?? [],
    rowCount: data?.count ?? 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  const handleAdjustSuccess = () => {
    toast.success(t("loyalty.adjustSuccess"))
    refetch()
    setIsAdjustDialogOpen(false)
    setSelectedCustomer(null)
  }

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert string values to numbers to ensure proper validation
    const cleanedData: Partial<LoyaltyConfig> = {}
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        cleanedData[key as keyof LoyaltyConfig] = null as any
      } else if (typeof value === "string" && !isNaN(parseFloat(value))) {
        // Convert string numbers to actual numbers
        cleanedData[key as keyof LoyaltyConfig] = parseFloat(value) as any
      } else {
        cleanedData[key as keyof LoyaltyConfig] = value as any
      }
    })
    
    updateMutation.mutate(cleanedData)
  }

  const handleNumberChange = (field: keyof LoyaltyConfig, value: string) => {
    const numValue = value === "" ? null : parseFloat(value)
    setFormData(prev => ({ ...prev, [field]: numValue }))
  }

  const handleSwitchChange = (field: keyof LoyaltyConfig, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="management">
        <Tabs.List>
          <Tabs.Trigger value="management">{t("loyalty.customers")}</Tabs.Trigger>
          <Tabs.Trigger value="configuration">{t("loyalty.configuration")}</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="management" className="space-y-4 mt-4">
          <LoyaltyAnalytics />
          
          <Container className="divide-y p-0">
            <DataTable instance={table}>
              <DataTable.Toolbar className="flex items-start justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <Heading>{t("loyalty.title")}</Heading>
                  <Text size="small" className="text-ui-fg-subtle mt-1">
                    {t("common.description")}
                  </Text>
                </div>
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
        </Tabs.Content>

        <Tabs.Content value="configuration" className="mt-4">
          <Container>
            <div className="p-6">
              <div className="mb-6">
                <Heading level="h1">{t("loyalty.configuration")}</Heading>
                <Text size="small" className="text-ui-fg-subtle mt-2">
                  {t("loyalty.programOverview")}
                </Text>
              </div>

              {isConfigLoading ? (
                <div className="p-6">
                  <Text>{t("common.loading")}</Text>
                </div>
              ) : (
                <form onSubmit={handleConfigSubmit} className="space-y-8">
                  {/* Earning Rules */}
                  <div className="space-y-4">
                    <Heading level="h2" className="text-lg">{t("loyalty.earningRules")}</Heading>
                    
                    <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-md">
                      <div>
                        <Label>{t("common.enabled")}</Label>
                        <Text size="small" className="text-ui-fg-subtle">
                          {t("loyalty.welcomeBonusDescription")}
                        </Text>
                      </div>
                      <Switch
                        checked={formData.earning_enabled ?? true}
                        onCheckedChange={(checked) => handleSwitchChange("earning_enabled", checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="earning_rate">{t("loyalty.pointsPerCurrency")}</Label>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {t("loyalty.pointsPerCurrencyDescription")}
                      </Text>
                      <Input
                        id="earning_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.earning_rate ?? 1}
                        onChange={(e) => handleNumberChange("earning_rate", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="min_order_amount">{t("loyalty.minOrderValue")}</Label>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {t("loyalty.minOrderValueDescription")}
                      </Text>
                      <Input
                        id="min_order_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.min_order_amount ?? 0}
                        onChange={(e) => handleNumberChange("min_order_amount", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Redemption Rules */}
                  <div className="space-y-4">
                    <Heading level="h2" className="text-lg">{t("loyalty.redemptionRules")}</Heading>
                    
                    <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-md">
                      <div>
                        <Label>{t("common.enabled")}</Label>
                        <Text size="small" className="text-ui-fg-subtle">
                          {t("loyalty.redemptionRules")}
                        </Text>
                      </div>
                      <Switch
                        checked={formData.redemption_enabled ?? true}
                        onCheckedChange={(checked) => handleSwitchChange("redemption_enabled", checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="redemption_rate">{t("loyalty.pointsPerCurrencyRedemption")}</Label>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {t("loyalty.pointsPerCurrencyRedemptionDescription")}
                      </Text>
                      <Input
                        id="redemption_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.redemption_rate ?? 1}
                        onChange={(e) => handleNumberChange("redemption_rate", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="min_points_redemption">{t("loyalty.minPointsRedemption")}</Label>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {t("loyalty.minPointsRedemptionDescription")}
                      </Text>
                      <Input
                        id="min_points_redemption"
                        type="number"
                        min="0"
                        value={formData.min_points_redemption ?? 0}
                        onChange={(e) => handleNumberChange("min_points_redemption", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_points_per_order">{t("loyalty.maxRedemptionPercentage")}</Label>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {t("loyalty.maxRedemptionPercentageDescription")}
                      </Text>
                      <Input
                        id="max_points_per_order"
                        type="number"
                        min="0"
                        value={formData.max_points_per_order ?? ""}
                        onChange={(e) => handleNumberChange("max_points_per_order", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? t("common.loading") : t("common.save")}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Container>
        </Tabs.Content>
      </Tabs>

      {selectedCustomer && (
        <AdjustPointsDialog
          open={isAdjustDialogOpen}
          onOpenChange={setIsAdjustDialogOpen}
          customer={selectedCustomer}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Loyalty Points",
  icon: CurrencyDollar,
})

export default LoyaltyPointsPage