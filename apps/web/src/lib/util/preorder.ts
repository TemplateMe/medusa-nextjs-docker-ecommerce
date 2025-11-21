/**
 * Client-safe preorder utility functions
 * These can be used in both server and client components
 */

/**
 * Check if a variant is available for preorder
 */
export function isPreorderVariant(variant: any): boolean {
  return (
    variant?.preorder_variant &&
    variant.preorder_variant.status === "enabled" &&
    new Date(variant.preorder_variant.available_date) > new Date()
  )
}

/**
 * Get the preorder available date for a variant
 */
export function getPreorderAvailableDate(variant: any): Date | null {
  if (!isPreorderVariant(variant)) {
    return null
  }
  return new Date(variant.preorder_variant.available_date)
}

/**
 * Format preorder date for display
 */
export function formatPreorderDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

