export enum PreorderVariantStatus {
  ENABLED = "enabled",
  DISABLED = "disabled",
}

export enum PreorderStatus {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
}

export interface PreorderVariant {
  id: string
  variant_id: string
  available_date: string
  status: PreorderVariantStatus
  product_variant?: {
    id: string
    title: string
    thumbnail?: string
    product?: {
      id: string
      title: string
      handle: string
      thumbnail?: string
    }
  }
}

export interface Preorder {
  id: string
  order_id: string
  status: PreorderStatus
  item: PreorderVariant
}

