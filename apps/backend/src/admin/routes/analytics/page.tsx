import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { 
  Container,
  Heading,
  Text,
  Badge,
  Tabs,
  Table,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

type OrderStats = {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_today: number
  revenue_today: number
  orders_this_week: number
  revenue_this_week: number
  orders_this_month: number
  revenue_this_month: number
  pending_orders: number
  completed_orders: number
  canceled_orders: number
}

type CustomerStats = {
  total_customers: number
  new_customers_today: number
  new_customers_this_week: number
  new_customers_this_month: number
  returning_customers: number
  average_orders_per_customer: number
}

type ProductStats = {
  total_products: number
  published_products: number
  draft_products: number
  out_of_stock_products: number
  low_stock_products: number
}

type TimeSeriesData = {
  date: string
  orders: number
  revenue: number
}

type TopProduct = {
  product_id: string
  product_title: string
  total_quantity: number
  total_revenue: number
}

type TopCustomer = {
  customer_id: string
  customer_email: string
  customer_name: string
  total_orders: number
  total_spent: number
}

type AnalyticsResponse = {
  order_stats: OrderStats
  customer_stats: CustomerStats
  product_stats: ProductStats
  revenue_by_day: TimeSeriesData[]
  orders_by_day: TimeSeriesData[]
  top_products: TopProduct[]
  top_customers: TopCustomer[]
  revenue_by_region: { region: string; revenue: number }[]
  orders_by_status: { status: string; count: number }[]
  sales_by_currency: { currency: string; total: number }[]
}

// Simple bar chart component
const SimpleBarChart = ({ 
  data, 
  dataKey, 
  color = "#8b5cf6",
  height = 200 
}: { 
  data: TimeSeriesData[]
  dataKey: "orders" | "revenue"
  color?: string
  height?: number
}) => {
  if (!data || data.length === 0) {
    return <div className="text-ui-fg-subtle text-center py-8">No data available</div>
  }
  
  const values = data.map(d => d[dataKey] || 0)
  const maxValue = Math.max(...values, 1)
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((item, index) => {
          const value = item[dataKey] || 0
          const barHeight = (value / maxValue) * 100
          return (
            <div 
              key={index}
              className="flex-1 flex flex-col items-center justify-end h-full group"
            >
              <div 
                className="w-full rounded-t transition-all duration-200 hover:opacity-80 relative"
                style={{ 
                  height: `${Math.max(barHeight, 2)}%`,
                  backgroundColor: color,
                  minHeight: '2px'
                }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-ui-bg-base border border-ui-border-base rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                  <div className="font-medium">{item.date}</div>
                  <div>{dataKey === "revenue" ? `$${value.toLocaleString()}` : value}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-ui-fg-subtle">
        <span>{data[0]?.date?.slice(5) || ""}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(5) || ""}</span>
        <span>{data[data.length - 1]?.date?.slice(5) || ""}</span>
      </div>
    </div>
  )
}

// Simple pie/donut chart component
const SimpleDonutChart = ({ 
  data,
  colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1"]
}: { 
  data: { label: string; value: number }[]
  colors?: string[]
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return <div className="text-ui-fg-subtle text-center py-8">No data available</div>
  
  let cumulativePercent = 0
  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return {
      ...item,
      percent,
      startPercent,
      color: colors[index % colors.length]
    }
  })

  // Create conic gradient
  const gradientStops = segments.map(seg => 
    `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`
  ).join(', ')

  return (
    <div className="flex items-center gap-6">
      <div 
        className="w-32 h-32 rounded-full relative"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      >
        <div className="absolute inset-4 bg-ui-bg-base rounded-full flex items-center justify-center">
          <Text className="font-semibold">{total}</Text>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((seg, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: seg.color }}
            />
            <Text size="small" className="text-ui-fg-subtle">
              {seg.label}: {seg.value} ({seg.percent.toFixed(1)}%)
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats card component
const StatCard = ({ 
  title, 
  value, 
  subtitle,
  trend,
  icon
}: { 
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; positive: boolean }
  icon?: React.ReactNode
}) => (
  <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
    <div className="flex items-start justify-between">
      <div>
        <Text size="small" className="text-ui-fg-subtle mb-1">
          {title}
        </Text>
        <Heading level="h2" className="text-ui-fg-base">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Heading>
        {subtitle && (
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            {subtitle}
          </Text>
        )}
      </div>
      {trend && (
        <Badge color={trend.positive ? "green" : "red"}>
          {trend.positive ? "+" : ""}{trend.value}%
        </Badge>
      )}
      {icon && <div className="text-ui-fg-subtle">{icon}</div>}
    </div>
  </div>
)

// Horizontal bar component for rankings
const HorizontalBar = ({ 
  value, 
  maxValue, 
  color = "#8b5cf6" 
}: { 
  value: number
  maxValue: number
  color?: string
}) => {
  const width = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="w-full bg-ui-bg-subtle-hover rounded-full h-2">
      <div 
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

const AnalyticsPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")

  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["analytics"],
    queryFn: () => sdk.client.fetch("/admin/analytics", {
      method: "GET",
    }),
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Helper to translate order status
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      waiting: t("analytics.orderStatusWaiting"),
      shipped: t("analytics.orderStatusShipped"),
      delivered: t("analytics.orderStatusDelivered"),
      canceled: t("analytics.orderStatusCanceled"),
    }
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (isLoading) {
    return (
      <Container className="p-0">
        <div className="p-6">
          <Heading className="mb-6">{t("analytics.title")}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-ui-bg-subtle rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error || !data) {
    return (
      <Container className="p-0">
        <div className="p-6">
          <Heading className="mb-6">{t("analytics.title")}</Heading>
          <div className="text-center py-12">
            <Text className="text-ui-fg-subtle">{t("analytics.errorLoading")}</Text>
          </div>
        </div>
      </Container>
    )
  }

  const { 
    order_stats, 
    customer_stats, 
    product_stats, 
    revenue_by_day,
    top_products, 
    top_customers,
    revenue_by_region,
    orders_by_status,
    sales_by_currency
  } = data

  const maxProductRevenue = Math.max(...top_products.map(p => p.total_revenue), 1)
  const maxCustomerSpent = Math.max(...top_customers.map(c => c.total_spent), 1)
  const maxRegionRevenue = Math.max(...revenue_by_region.map(r => r.revenue), 1)

  return (
    <Container className="p-0">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading>{t("analytics.title")}</Heading>
            <Text className="text-ui-fg-subtle mt-1">{t("analytics.subtitle")}</Text>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">{t("analytics.tabs.overview")}</Tabs.Trigger>
            <Tabs.Trigger value="orders">{t("analytics.tabs.orders")}</Tabs.Trigger>
            <Tabs.Trigger value="customers">{t("analytics.tabs.customers")}</Tabs.Trigger>
            <Tabs.Trigger value="products">{t("analytics.tabs.products")}</Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" className="mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title={t("analytics.totalRevenue")}
                value={formatCurrency(order_stats.total_revenue)}
                subtitle={t("analytics.allTime")}
              />
              <StatCard 
                title={t("analytics.totalOrders")}
                value={order_stats.total_orders}
                subtitle={t("analytics.allTime")}
              />
              <StatCard 
                title={t("analytics.totalCustomers")}
                value={customer_stats.total_customers}
                subtitle={t("analytics.registered")}
              />
              <StatCard 
                title={t("analytics.avgOrderValue")}
                value={formatCurrency(order_stats.average_order_value)}
                subtitle={t("analytics.perOrder")}
              />
            </div>

            {/* Today's Stats */}
            <Heading level="h3" className="mb-4">{t("analytics.todayStats")}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title={t("analytics.ordersToday")}
                value={order_stats.orders_today}
              />
              <StatCard 
                title={t("analytics.revenueToday")}
                value={formatCurrency(order_stats.revenue_today)}
              />
              <StatCard 
                title={t("analytics.newCustomersToday")}
                value={customer_stats.new_customers_today}
              />
              <StatCard 
                title={t("analytics.pendingOrders")}
                value={order_stats.pending_orders}
              />
            </div>

            {/* Revenue Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
                <Heading level="h3" className="mb-4">{t("analytics.revenueLast30Days")}</Heading>
                <SimpleBarChart 
                  data={revenue_by_day} 
                  dataKey="revenue"
                  color="#8b5cf6"
                  height={180}
                />
              </div>
              <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
                <Heading level="h3" className="mb-4">{t("analytics.ordersLast30Days")}</Heading>
                <SimpleBarChart 
                  data={revenue_by_day} 
                  dataKey="orders"
                  color="#06b6d4"
                  height={180}
                />
              </div>
            </div>

            {/* Order Status & Sales by Currency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
                <Heading level="h3" className="mb-4">{t("analytics.ordersByStatus")}</Heading>
                <SimpleDonutChart 
                  data={orders_by_status.map(item => ({
                    label: getStatusLabel(item.status),
                    value: item.count
                  }))}
                  colors={["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"]}
                />
              </div>
              <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
                <Heading level="h3" className="mb-4">{t("analytics.salesByCurrency")}</Heading>
                <SimpleDonutChart 
                  data={sales_by_currency.map(item => ({
                    label: item.currency,
                    value: item.total
                  }))}
                />
              </div>
            </div>

            {/* Revenue by Region */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6 mb-8">
              <Heading level="h3" className="mb-4">{t("analytics.revenueByRegion")}</Heading>
              <div className="space-y-4">
                {revenue_by_region.slice(0, 5).map((region, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <Text size="small">{region.region}</Text>
                      <Text size="small" className="font-medium">
                        {formatCurrency(region.revenue)}
                      </Text>
                    </div>
                    <HorizontalBar 
                      value={region.revenue} 
                      maxValue={maxRegionRevenue}
                      color="#8b5cf6"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Tabs.Content>

          {/* Orders Tab */}
          <Tabs.Content value="orders" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title={t("analytics.ordersThisWeek")}
                value={order_stats.orders_this_week}
              />
              <StatCard 
                title={t("analytics.revenueThisWeek")}
                value={formatCurrency(order_stats.revenue_this_week)}
              />
              <StatCard 
                title={t("analytics.ordersThisMonth")}
                value={order_stats.orders_this_month}
              />
              <StatCard 
                title={t("analytics.revenueThisMonth")}
                value={formatCurrency(order_stats.revenue_this_month)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard 
                title={t("analytics.pendingOrders")}
                value={order_stats.pending_orders}
              />
              <StatCard 
                title={t("analytics.completedOrders")}
                value={order_stats.completed_orders}
              />
              <StatCard 
                title={t("analytics.canceledOrders")}
                value={order_stats.canceled_orders}
              />
            </div>

            {/* Order Status Chart */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6 mb-8">
              <Heading level="h3" className="mb-4">{t("analytics.orderStatusBreakdown")}</Heading>
              <SimpleDonutChart 
                data={orders_by_status.map(item => ({
                  label: getStatusLabel(item.status),
                  value: item.count
                }))}
                colors={["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#06b6d4"]}
              />
            </div>

            {/* Orders by Day Chart */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
              <Heading level="h3" className="mb-4">{t("analytics.dailyOrderTrend")}</Heading>
              <SimpleBarChart 
                data={revenue_by_day} 
                dataKey="orders"
                color="#06b6d4"
                height={250}
              />
            </div>
          </Tabs.Content>

          {/* Customers Tab */}
          <Tabs.Content value="customers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title={t("analytics.totalCustomers")}
                value={customer_stats.total_customers}
              />
              <StatCard 
                title={t("analytics.newCustomersToday")}
                value={customer_stats.new_customers_today}
              />
              <StatCard 
                title={t("analytics.avgOrdersPerCustomer")}
                value={customer_stats.average_orders_per_customer}
              />
              <StatCard 
                title={t("analytics.avgSpentPerCustomer")}
                value={formatCurrency(order_stats.total_revenue / (customer_stats.total_customers || 1))}
              />
            </div>

            {/* Top Customers */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
              <Heading level="h3" className="mb-4">{t("analytics.topCustomers")}</Heading>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>#</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.customer")}</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.totalOrders")}</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.totalSpent")}</Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {top_customers.map((customer, index) => (
                    <Table.Row key={customer.customer_id}>
                      <Table.Cell>
                        <Badge color={index < 3 ? "green" : "grey"}>{index + 1}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <Text size="small" className="font-medium">{customer.customer_name}</Text>
                          <Text size="xsmall" className="text-ui-fg-subtle">{customer.customer_email}</Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{customer.total_orders}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(customer.total_spent)}</span>
                          <div className="w-20">
                            <HorizontalBar 
                              value={customer.total_spent} 
                              maxValue={maxCustomerSpent}
                              color="#10b981"
                            />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Link 
                          to={`/customers/${customer.customer_id}`}
                          className="text-ui-fg-interactive hover:underline text-sm"
                        >
                          {t("common.view")}
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          </Tabs.Content>

          {/* Products Tab */}
          <Tabs.Content value="products" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title={t("analytics.totalProducts")}
                value={product_stats.total_products}
              />
              <StatCard 
                title={t("analytics.publishedProducts")}
                value={product_stats.published_products}
              />
              <StatCard 
                title={t("analytics.draftProducts")}
                value={product_stats.draft_products}
              />
              <StatCard 
                title={t("analytics.outOfStock")}
                value={product_stats.out_of_stock_products}
              />
            </div>

            {/* Top Products */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
              <Heading level="h3" className="mb-4">{t("analytics.topSellingProducts")}</Heading>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>#</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.productName")}</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.unitsSold")}</Table.HeaderCell>
                    <Table.HeaderCell>{t("analytics.revenue")}</Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {top_products.map((product, index) => (
                    <Table.Row key={product.product_id}>
                      <Table.Cell>
                        <Badge color={index < 3 ? "green" : "grey"}>{index + 1}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" className="font-medium">{product.product_title}</Text>
                      </Table.Cell>
                      <Table.Cell>{product.total_quantity}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(product.total_revenue)}</span>
                          <div className="w-20">
                            <HorizontalBar 
                              value={product.total_revenue} 
                              maxValue={maxProductRevenue}
                              color="#8b5cf6"
                            />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Link 
                          to={`/products/${product.product_id}`}
                          className="text-ui-fg-interactive hover:underline text-sm"
                        >
                          {t("common.view")}
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>

            {/* Product Status Distribution */}
            <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6 mt-6">
              <Heading level="h3" className="mb-4">{t("analytics.productStatusDistribution")}</Heading>
              <SimpleDonutChart 
                data={[
                  { label: t("analytics.published"), value: product_stats.published_products },
                  { label: t("analytics.draft"), value: product_stats.draft_products },
                ]}
                colors={["#10b981", "#6366f1"]}
              />
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
})

export default AnalyticsPage
