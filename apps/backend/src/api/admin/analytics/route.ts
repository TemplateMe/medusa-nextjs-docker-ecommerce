import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

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

const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const getStartOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  
  const today = getStartOfDay()
  const weekStart = getStartOfWeek()
  const monthStart = getStartOfMonth()

  // Fetch all orders with related data
  // Include summary for proper totals access - Medusa v2 stores computed totals in summary
  // Use items.* to get all item fields like the invoice workflow does
  // Note: In Medusa v2, fulfillment_status is NOT a direct field on order
  // Fulfillments are tracked via the fulfillment module and linked via order_fulfillment
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "created_at",
      "total",
      "subtotal",
      "item_total",
      "shipping_total",
      "tax_total",
      "discount_total",
      "summary.*",
      "currency_code",
      "customer_id",
      "region_id",
      "region.name",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      // Fulfillments are linked via order module
      "fulfillments.*",
    ],
  })

  // Fetch all customers
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "created_at"],
  })

  // Fetch all products with their variants
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "variants.id"],
  })

  // Fetch product variants
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id", 
      "product_id", 
      "manage_inventory",
    ],
  })

  // Fetch variant-inventory item links
  const { data: variantInventoryLinks } = await query.graph({
    entity: "product_variant_inventory_item",
    fields: [
      "variant_id",
      "inventory_item_id",
    ],
  })

  // Fetch inventory levels with stocked and reserved quantities
  const { data: inventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: [
      "id",
      "inventory_item_id",
      "stocked_quantity",
      "reserved_quantity",
    ],
  })

  // Debug logging
  const debugLogger = req.scope.resolve("logger")
  debugLogger.info(`[Analytics] Inventory levels found: ${inventoryLevels.length}`)
  if (inventoryLevels.length > 0) {
    debugLogger.info(`[Analytics] First inventory level: ${JSON.stringify(inventoryLevels[0])}`)
  }
  debugLogger.info(`[Analytics] Variants found: ${variants.length}`)
  debugLogger.info(`[Analytics] Variant-Inventory links found: ${variantInventoryLinks.length}`)
  if (variantInventoryLinks.length > 0) {
    debugLogger.info(`[Analytics] First link: ${JSON.stringify(variantInventoryLinks[0])}`)
  }

  // Build inventory item to available quantity map
  const inventoryByItemId = new Map<string, number>()
  inventoryLevels.forEach((level: any) => {
    const available = (level.stocked_quantity || 0) - (level.reserved_quantity || 0)
    const existing = inventoryByItemId.get(level.inventory_item_id) || 0
    // Sum across all locations for this inventory item
    inventoryByItemId.set(level.inventory_item_id, existing + available)
  })

  // Build variant to inventory items mapping from link table
  const variantToInventoryItems = new Map<string, string[]>()
  variantInventoryLinks.forEach((link: any) => {
    if (link.variant_id && link.inventory_item_id) {
      const existing = variantToInventoryItems.get(link.variant_id) || []
      existing.push(link.inventory_item_id)
      variantToInventoryItems.set(link.variant_id, existing)
    }
  })

  // Build variant to available quantity map
  const variantInventory = new Map<string, number>()
  variants.forEach((v: any) => {
    const inventoryItemIds = variantToInventoryItems.get(v.id) || []
    let totalAvailable = 0
    inventoryItemIds.forEach((itemId: string) => {
      totalAvailable += inventoryByItemId.get(itemId) || 0
    })
    variantInventory.set(v.id, totalAvailable)
    
    // Debug log for variants with inventory
    if (inventoryItemIds.length > 0) {
      debugLogger.info(`[Analytics] Variant ${v.id} has ${inventoryItemIds.length} inventory items, available: ${totalAvailable}`)
    }
  })

  // Group variants by product
  const variantsByProduct = new Map<string, any[]>()
  variants.forEach((v: any) => {
    if (v.product_id) {
      const existing = variantsByProduct.get(v.product_id) || []
      existing.push({
        ...v,
        available_quantity: variantInventory.get(v.id) || 0,
      })
      variantsByProduct.set(v.product_id, existing)
    }
  })

  // Helper function to safely parse date
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date(0)
    if (dateValue instanceof Date) return dateValue
    return new Date(dateValue)
  }

  // Helper to safely convert to number (handles BigNumber/Decimal types from Medusa v2)
  const toNumber = (val: any): number => {
    if (val === null || val === undefined) return 0
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseFloat(val) || 0
    // Handle BigNumber objects that have valueOf or toNumber
    if (typeof val === 'object') {
      if (typeof val.toNumber === 'function') return val.toNumber()
      if (typeof val.valueOf === 'function') {
        const v = val.valueOf()
        return typeof v === 'number' ? v : parseFloat(String(v)) || 0
      }
    }
    return parseFloat(String(val)) || 0
  }

  // Helper to get total - try multiple sources
  // In Medusa v2, the order summary contains the computed totals
  const getOrderTotal = (order: any): number => {
    let total = 0
    
    // First priority: summary.current_order_total (most accurate in Medusa v2)
    if (order.summary?.current_order_total !== undefined && order.summary?.current_order_total !== null) {
      total = toNumber(order.summary.current_order_total)
    }
    // Second priority: summary.original_order_total
    else if (order.summary?.original_order_total !== undefined && order.summary?.original_order_total !== null) {
      total = toNumber(order.summary.original_order_total)
    }
    // Third priority: direct total field
    else if (order.total !== undefined && order.total !== null) {
      total = toNumber(order.total)
    }
    // Fourth priority: summary.paid_total (for completed orders)
    else if (order.summary?.paid_total !== undefined && order.summary?.paid_total !== null) {
      total = toNumber(order.summary.paid_total)
    }
    // Fallback: calculate from item_total + shipping_total
    else {
      const itemTotal = toNumber(order.item_total)
      const shippingTotal = toNumber(order.shipping_total)
      total = itemTotal + shippingTotal
    }
    
    // If still no total, try calculating from items
    if (total === 0 && order.items && Array.isArray(order.items)) {
      total = order.items.reduce((sum: number, item: any) => {
        const itemSubtotal = toNumber(item.total) || toNumber(item.subtotal) || (toNumber(item.unit_price) * toNumber(item.quantity))
        return sum + itemSubtotal
      }, 0)
    }
    
    return total
  }

  // Helper to check if order should count towards revenue (not canceled)
  const isRevenueOrder = (order: any): boolean => {
    return order.status !== "canceled"
  }

  // Helper to determine fulfillment status from fulfillments array
  // In Medusa v2, orders have a fulfillments array (can be empty)
  // Each fulfillment has a status: created, picked, packed, shipped, delivered, canceled
  const getOrderFulfillmentStatus = (order: any): string => {
    const fulfillments = order.fulfillments || []
    
    if (fulfillments.length === 0) {
      return "not_fulfilled"
    }
    
    // Check fulfillment statuses
    const hasDelivered = fulfillments.some((f: any) => f.delivered_at || f.status === "delivered")
    const hasShipped = fulfillments.some((f: any) => f.shipped_at || f.status === "shipped")
    const hasCanceled = fulfillments.every((f: any) => f.canceled_at || f.status === "canceled")
    
    if (hasCanceled) return "canceled"
    if (hasDelivered) return "delivered"
    if (hasShipped) return "shipped"
    
    // Has fulfillments but not shipped/delivered yet - means it's been created (in progress)
    return "processing"
  }

  // Pre-calculate order data once to avoid multiple calculations
  // This includes total, fulfillment status, and whether it's a revenue order
  const orderDataCache = new Map<string, { total: number; fulfillmentStatus: string; isRevenue: boolean; createdAt: Date }>()
  
  orders.forEach((o: any) => {
    orderDataCache.set(o.id, {
      total: getOrderTotal(o),
      fulfillmentStatus: getOrderFulfillmentStatus(o),
      isRevenue: isRevenueOrder(o),
      createdAt: parseDate(o.created_at)
    })
  })

  // Debug: Log order breakdown using cached data
  debugLogger.info(`[Analytics] Orders breakdown:`)
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    debugLogger.info(`[Analytics]   ${o.id}: status=${o.status}, fulfillment=${data.fulfillmentStatus}, total=${data.total}, isRevenue=${data.isRevenue}`)
  })

  // Calculate Order Stats using cached data
  const totalOrders = orders.length
  
  // Calculate total revenue (only non-canceled orders)
  let totalRevenue = 0
  orderDataCache.forEach((data) => {
    if (data.isRevenue) {
      totalRevenue += data.total
    }
  })
  const averageOrderValue = orders.filter((o: any) => orderDataCache.get(o.id)!.isRevenue).length > 0 
    ? totalRevenue / orders.filter((o: any) => orderDataCache.get(o.id)!.isRevenue).length 
    : 0

  const ordersToday = orders.filter((o: any) => orderDataCache.get(o.id)!.createdAt >= today)
  const ordersThisWeek = orders.filter((o: any) => orderDataCache.get(o.id)!.createdAt >= weekStart)
  const ordersThisMonth = orders.filter((o: any) => orderDataCache.get(o.id)!.createdAt >= monthStart)

  // Get unique statuses for debugging
  const uniqueStatuses = [...new Set(orders.map((o: any) => o.status))]
  const uniqueFulfillmentStatuses = [...new Set(Array.from(orderDataCache.values()).map(d => d.fulfillmentStatus))]
  debugLogger.info(`[Analytics] Unique order statuses found: ${uniqueStatuses.join(', ')}`)
  debugLogger.info(`[Analytics] Unique fulfillment statuses found: ${uniqueFulfillmentStatuses.join(', ')}`)

  // Count orders by fulfillment status using cached data
  // Pending/Waiting = not_fulfilled or processing (fulfillment created but not shipped)
  // Completed = shipped or delivered
  // Canceled = order.status === "canceled"
  let pendingOrders = 0
  let completedOrders = 0
  let canceledOrders = 0
  
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    if (o.status === "canceled") {
      canceledOrders++
    } else if (data.fulfillmentStatus === "shipped" || data.fulfillmentStatus === "delivered") {
      completedOrders++
    } else {
      pendingOrders++
    }
  })

  debugLogger.info(`[Analytics] Order counts: pending=${pendingOrders}, completed=${completedOrders}, canceled=${canceledOrders}`)
  debugLogger.info(`[Analytics] Total revenue (non-canceled): ${totalRevenue}`)

  // Calculate period-specific revenue using cached data
  let revenueToday = 0
  let revenueThisWeek = 0
  let revenueThisMonth = 0
  
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    if (!data.isRevenue) return
    
    if (data.createdAt >= today) {
      revenueToday += data.total
    }
    if (data.createdAt >= weekStart) {
      revenueThisWeek += data.total
    }
    if (data.createdAt >= monthStart) {
      revenueThisMonth += data.total
    }
  })

  const orderStats: OrderStats = {
    total_orders: totalOrders,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    average_order_value: Math.round(averageOrderValue * 100) / 100,
    orders_today: ordersToday.length,
    revenue_today: Math.round(revenueToday * 100) / 100,
    orders_this_week: ordersThisWeek.length,
    revenue_this_week: Math.round(revenueThisWeek * 100) / 100,
    orders_this_month: ordersThisMonth.length,
    revenue_this_month: Math.round(revenueThisMonth * 100) / 100,
    pending_orders: pendingOrders,
    completed_orders: completedOrders,
    canceled_orders: canceledOrders,
  }

  // Calculate Customer Stats
  const totalCustomers = customers.length
  
  // Debug: Log date comparisons
  debugLogger.info(`[Analytics] Today start: ${today.toISOString()}`)
  debugLogger.info(`[Analytics] Week start: ${weekStart.toISOString()}`)
  debugLogger.info(`[Analytics] Month start: ${monthStart.toISOString()}`)
  if (customers.length > 0) {
    debugLogger.info(`[Analytics] First customer created_at: ${customers[0].created_at}`)
  }
  
  // Filter customers by date - ensure proper date comparison
  const newCustomersToday = customers.filter((c: any) => {
    const createdAt = parseDate(c.created_at)
    return createdAt >= today
  }).length
  
  const newCustomersThisWeek = customers.filter((c: any) => {
    const createdAt = parseDate(c.created_at)
    return createdAt >= weekStart
  }).length
  
  const newCustomersThisMonth = customers.filter((c: any) => {
    const createdAt = parseDate(c.created_at)
    return createdAt >= monthStart
  }).length

  debugLogger.info(`[Analytics] New customers - today: ${newCustomersToday}, week: ${newCustomersThisWeek}, month: ${newCustomersThisMonth}`)

  // Calculate returning customers (customers with more than 1 order)
  const customerOrderCounts = new Map<string, number>()
  orders.forEach((o: any) => {
    if (o.customer_id) {
      customerOrderCounts.set(o.customer_id, (customerOrderCounts.get(o.customer_id) || 0) + 1)
    }
  })
  const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length
  const customersWithOrders = customerOrderCounts.size
  const averageOrdersPerCustomer = customersWithOrders > 0 ? totalOrders / customersWithOrders : 0

  const customerStats: CustomerStats = {
    total_customers: totalCustomers,
    new_customers_today: newCustomersToday,
    new_customers_this_week: newCustomersThisWeek,
    new_customers_this_month: newCustomersThisMonth,
    returning_customers: returningCustomers,
    average_orders_per_customer: Math.round(averageOrdersPerCustomer * 100) / 100,
  }

  // Calculate Product Stats
  const totalProducts = products.length
  const publishedProducts = products.filter((p: any) => p.status === "published").length
  const draftProducts = products.filter((p: any) => p.status === "draft").length

  // Count products with low or no stock using variants data
  let outOfStockProducts = 0
  let lowStockProducts = 0
  const LOW_STOCK_THRESHOLD = 10 // Consider low stock if <= 10 items
  
  products.forEach((p: any) => {
    const productVariants = variantsByProduct.get(p.id) || []
    
    if (productVariants.length === 0) {
      // No variants found, consider out of stock
      outOfStockProducts++
      return
    }
    
    // Check if all variants that manage inventory are out of stock
    const managedVariants = productVariants.filter((v: any) => v.manage_inventory !== false)
    
    if (managedVariants.length === 0) {
      // No variants manage inventory, skip inventory checks
      return
    }
    
    // Use available_quantity (stocked - reserved) from inventory levels
    const allOutOfStock = managedVariants.every((v: any) => {
      const qty = v.available_quantity || 0
      return qty <= 0
    })
    
    if (allOutOfStock) {
      outOfStockProducts++
      return
    }
    
    // Check if any variant has low stock (1-10 items available)
    const hasLowStock = managedVariants.some((v: any) => {
      const qty = v.available_quantity || 0
      return qty > 0 && qty <= LOW_STOCK_THRESHOLD
    })
    
    if (hasLowStock) {
      lowStockProducts++
    }
  })

  const productStats: ProductStats = {
    total_products: totalProducts,
    published_products: publishedProducts,
    draft_products: draftProducts,
    out_of_stock_products: outOfStockProducts,
    low_stock_products: lowStockProducts,
  }

  // Calculate revenue and orders by day (last 30 days) using cached data
  const revenueByDay: TimeSeriesData[] = []
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStart = getStartOfDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    
    const dayOrders = orders.filter((o: any) => {
      const data = orderDataCache.get(o.id)!
      return data.createdAt >= dayStart && data.createdAt < dayEnd
    })
    
    // Sum revenue using cached totals
    let dayRevenue = 0
    dayOrders.forEach((o: any) => {
      const data = orderDataCache.get(o.id)!
      dayRevenue += data.total
    })
    
    revenueByDay.push({
      date: dateStr,
      orders: dayOrders.length,
      revenue: Math.round(dayRevenue * 100) / 100,
    })
  }

  // Calculate top products from order items (exclude canceled orders)
  const productSales = new Map<string, { quantity: number; revenue: number; title: string }>()
  
  // Build variant to product mapping for fallback
  const variantToProduct = new Map<string, { productId: string; productTitle: string }>()
  variants.forEach((v: any) => {
    if (v.product_id) {
      const product = products.find((p: any) => p.id === v.product_id)
      variantToProduct.set(v.id, {
        productId: v.product_id,
        productTitle: product?.title || "Unknown Product",
      })
    }
  })

  // Only count non-canceled orders for product sales
  orders.filter(isRevenueOrder).forEach((o: any) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        // Try to get product_id from multiple sources (Medusa v2 structure)
        // 1. Direct product_id field
        // 2. Via variant.product.id
        // 3. Via variant_id lookup
        let productId = item.product_id
        let productTitle = item.product_title || item.title || "Unknown Product"
        
        // If no direct product_id, try via variant.product
        if (!productId && item.variant?.product?.id) {
          productId = item.variant.product.id
          productTitle = item.variant.product.title || productTitle
        }
        
        // If still no product_id, try to resolve via variant_id
        if (!productId && item.variant_id) {
          const variantInfo = variantToProduct.get(item.variant_id)
          if (variantInfo) {
            productId = variantInfo.productId
            productTitle = variantInfo.productTitle
          }
        }
        
        if (!productId) return
        
        const quantity = item.quantity || 0
        // Use item.total or item.subtotal if available, otherwise calculate from unit_price
        const itemRevenue = toNumber(item.total) || toNumber(item.subtotal) || (toNumber(item.unit_price) * quantity)
        
        const existing = productSales.get(productId) || { 
          quantity: 0, 
          revenue: 0, 
          title: productTitle 
        }
        
        productSales.set(productId, {
          quantity: existing.quantity + quantity,
          revenue: existing.revenue + itemRevenue,
          title: existing.title || productTitle,
        })
      })
    }
  })

  const topProducts: TopProduct[] = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      product_id: productId,
      product_title: data.title,
      total_quantity: data.quantity,
      total_revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10)

  // Calculate top customers (exclude canceled orders from spending) using cached data
  const customerSpending = new Map<string, { orders: number; spent: number; email: string; name: string }>()
  
  // Build customer lookup map for efficiency
  const customerMap = new Map<string, any>()
  customers.forEach((c: any) => {
    customerMap.set(c.id, c)
  })
  
  // Only count non-canceled orders for customer spending
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    if (!data.isRevenue || !o.customer_id) return
    
    const customer = customerMap.get(o.customer_id)
    
    const existing = customerSpending.get(o.customer_id)
    
    if (existing) {
      existing.orders += 1
      existing.spent += data.total
    } else {
      customerSpending.set(o.customer_id, { 
        orders: 1, 
        spent: data.total, 
        email: customer?.email || "Unknown",
        name: customer?.first_name && customer?.last_name 
          ? `${customer.first_name} ${customer.last_name}` 
          : customer?.email || "Unknown"
      })
    }
  })

  const topCustomers: TopCustomer[] = Array.from(customerSpending.entries())
    .map(([customerId, data]) => ({
      customer_id: customerId,
      customer_email: data.email,
      customer_name: data.name,
      total_orders: data.orders,
      total_spent: Math.round(data.spent * 100) / 100,
    }))
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10)

  // Calculate revenue by region (exclude canceled orders) using cached data
  const regionRevenue = new Map<string, number>()
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    if (!data.isRevenue) return
    
    const regionName = o.region?.name || "Unknown"
    regionRevenue.set(regionName, (regionRevenue.get(regionName) || 0) + data.total)
  })

  const revenueByRegion = Array.from(regionRevenue.entries())
    .map(([region, revenue]) => ({ 
      region, 
      revenue: Math.round(revenue * 100) / 100 
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Calculate orders by status using cached data
  // Map to user-friendly labels:
  // - waiting: not_fulfilled or processing
  // - shipped: shipped
  // - delivered: delivered
  // - canceled: order.status === "canceled"
  const statusCounts = new Map<string, number>()
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    let displayStatus: string
    
    if (o.status === "canceled") {
      displayStatus = "canceled"
    } else if (data.fulfillmentStatus === "delivered") {
      displayStatus = "delivered"
    } else if (data.fulfillmentStatus === "shipped") {
      displayStatus = "shipped"
    } else {
      // not_fulfilled or processing
      displayStatus = "waiting"
    }
    
    statusCounts.set(displayStatus, (statusCounts.get(displayStatus) || 0) + 1)
  })

  const ordersByStatus = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // Calculate sales by currency (exclude canceled orders) using cached data
  const currencyTotals = new Map<string, number>()
  orders.forEach((o: any) => {
    const data = orderDataCache.get(o.id)!
    if (!data.isRevenue) return
    
    const currency = o.currency_code?.toUpperCase() || "USD"
    currencyTotals.set(currency, (currencyTotals.get(currency) || 0) + data.total)
  })

  const salesByCurrency = Array.from(currencyTotals.entries())
    .map(([currency, total]) => ({ 
      currency, 
      total: Math.round(total * 100) / 100 
    }))
    .sort((a, b) => b.total - a.total)

  const response: AnalyticsResponse = {
    order_stats: orderStats,
    customer_stats: customerStats,
    product_stats: productStats,
    revenue_by_day: revenueByDay,
    orders_by_day: revenueByDay, // Same data, frontend uses both
    top_products: topProducts,
    top_customers: topCustomers,
    revenue_by_region: revenueByRegion,
    orders_by_status: ordersByStatus,
    sales_by_currency: salesByCurrency,
  }

  res.json(response)
}
