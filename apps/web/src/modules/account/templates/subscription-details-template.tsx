"use client"

import { cancelSubscription, Subscription } from "@lib/data/subscriptions"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "@lib/i18n"

type SubscriptionDetailsTemplateProps = {
    subscription: Subscription
}

const SubscriptionDetailsTemplate = ({
    subscription,
}: SubscriptionDetailsTemplateProps) => {
    const router = useRouter()
    const [cancelling, setCancelling] = useState(false)
    const { t } = useTranslation()

    const handleCancel = async () => {
        setCancelling(true)
        const res = await cancelSubscription(subscription.id)
        if (res.success) {
            router.refresh()
        }
        setCancelling(false)
    }

    const {
        status,
        interval,
        period,
        subscription_date,
        next_order_date,
        expiration_date,
        metadata,
    } = subscription

    const getStatusText = () => {
        switch (status) {
            case "active":
                return t("subscriptions.statusActive")
            case "canceled":
                return t("subscriptions.statusCanceled")
            case "failed":
                return t("subscriptions.statusFailed")
            case "expired":
                return t("subscriptions.statusExpired")
            default:
                return String(status).charAt(0).toUpperCase() + String(status).slice(1)
        }
    }

    const getIntervalText = () => {
        return interval === "monthly" 
            ? t("subscriptions.monthly") 
            : t("subscriptions.yearly")
    }

    return (
        <div className="w-full" data-testid="subscription-details-page">
            <div className="mb-8 flex flex-col gap-y-4">
                <LocalizedClientLink
                    href="/account/subscriptions"
                    className="text-small-regular text-ui-fg-subtle hover:text-ui-fg-base mb-2"
                >
                    &larr; {t("subscriptions.backToSubscriptions")}
                </LocalizedClientLink>
                <div className="flex items-center justify-between">
                    <Heading level="h1" className="text-2xl-semi">
                        {t("subscriptions.subscriptionDetails")}
                    </Heading>
                    <span
                        className={clx("text-small-regular px-2 py-1 rounded-full", {
                            "bg-green-100 text-green-800": status === "active",
                            "bg-red-100 text-red-800": status === "canceled" || status === "failed",
                            "bg-gray-100 text-gray-800": status === "expired",
                        })}
                    >
                        {getStatusText()}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-y-8 bg-white p-6 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            {t("subscriptions.interval")}
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {getIntervalText()} ({t("subscriptions.every")} {period}{" "}
                            {interval === "monthly" ? t("subscriptions.month") : t("subscriptions.year")})
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            {t("subscriptions.startDate")}
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {format(new Date(subscription_date), "MMMM d, yyyy")}
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            {t("subscriptions.nextOrderDate")}
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {next_order_date
                                ? format(new Date(next_order_date), "MMMM d, yyyy")
                                : "-"}
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            {t("subscriptions.expirationDate")}
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {expiration_date
                                ? format(new Date(expiration_date), "MMMM d, yyyy")
                                : "-"}
                        </Text>
                    </div>
                </div>

                {status === "active" && (
                    <div className="border-t pt-6 mt-2">
                        <Heading level="h2" className="text-lg-semi mb-4">
                            {t("subscriptions.actions")}
                        </Heading>
                        <div className="flex flex-col gap-y-4">
                            <Text className="text-small-regular text-ui-fg-subtle">
                                {t("subscriptions.cancelWarning")}
                            </Text>
                            <Button
                                variant="danger"
                                className="w-fit"
                                onClick={handleCancel}
                                isLoading={cancelling}
                            >
                                {t("subscriptions.cancelSubscription")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubscriptionDetailsTemplate
