"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"

export type SubscriptionStatus = "active" | "canceled" | "expired" | "failed"
export type SubscriptionInterval = "monthly" | "yearly"

export type Subscription = {
    id: string
    status: SubscriptionStatus
    interval: SubscriptionInterval
    period: number
    subscription_date: string
    last_order_date: string
    next_order_date: string | null
    expiration_date: string
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
}

export async function listSubscriptions() {
    const headers = {
        ...(await getAuthHeaders()),
    }

    const next = {
        ...(await getCacheOptions("subscriptions")),
    }

    return await sdk.client
        .fetch<{ subscriptions: Subscription[] }>(`/store/customers/me/subscriptions`, {
            method: "GET",
            headers,
            next,
            cache: "no-store",
        })
        .then(({ subscriptions }) => subscriptions)
        .catch(() => null)
}

export async function cancelSubscription(id: string) {
    const headers = {
        ...(await getAuthHeaders()),
    }

    return await sdk.client
        .fetch(`/store/customers/me/subscriptions/${id}`, {
            method: "POST",
            headers,
        })
        .then(async () => {
            revalidateTag("subscriptions")
            return { success: true }
        })
        .catch((err) => {
            return { success: false, error: err.message }
        })
}

export async function getSubscription(id: string) {
    const subscriptions = await listSubscriptions()
    return subscriptions?.find((s) => s.id === id) || null
}
