"use client"

import { cancelSubscription, Subscription } from "@lib/data/subscriptions"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"

type SubscriptionDetailsTemplateProps = {
    subscription: Subscription
}

const SubscriptionDetailsTemplate = ({
    subscription,
}: SubscriptionDetailsTemplateProps) => {
    const router = useRouter()
    const [cancelling, setCancelling] = useState(false)

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

    return (
        <div className="w-full" data-testid="subscription-details-page">
            <div className="mb-8 flex flex-col gap-y-4">
                <LocalizedClientLink
                    href="/account/subscriptions"
                    className="text-small-regular text-ui-fg-subtle hover:text-ui-fg-base mb-2"
                >
                    &larr; Back to Subscriptions
                </LocalizedClientLink>
                <div className="flex items-center justify-between">
                    <Heading level="h1" className="text-2xl-semi">
                        Subscription Details
                    </Heading>
                    <span
                        className={clx("text-small-regular px-2 py-1 rounded-full", {
                            "bg-green-100 text-green-800": status === "active",
                            "bg-red-100 text-red-800": status === "canceled" || status === "failed",
                            "bg-gray-100 text-gray-800": status === "expired",
                        })}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-y-8 bg-white p-6 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            Interval
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {interval === "monthly" ? "Monthly" : "Yearly"} (Every {period}{" "}
                            {interval === "monthly" ? "month" : "year"})
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            Start Date
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {format(new Date(subscription_date), "MMMM d, yyyy")}
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            Next Order Date
                        </Text>
                        <Text className="text-ui-fg-base font-medium">
                            {next_order_date
                                ? format(new Date(next_order_date), "MMMM d, yyyy")
                                : "-"}
                        </Text>
                    </div>
                    <div>
                        <Text className="text-ui-fg-subtle text-small-regular mb-1">
                            Expiration Date
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
                            Actions
                        </Heading>
                        <div className="flex flex-col gap-y-4">
                            <Text className="text-small-regular text-ui-fg-subtle">
                                If you cancel your subscription, no further orders will be placed.
                            </Text>
                            <Button
                                variant="danger"
                                className="w-fit"
                                onClick={handleCancel}
                                isLoading={cancelling}
                            >
                                Cancel Subscription
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubscriptionDetailsTemplate
