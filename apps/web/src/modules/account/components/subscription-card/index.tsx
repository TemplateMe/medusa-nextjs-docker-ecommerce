import { Subscription } from "@lib/data/subscriptions"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { format } from "date-fns"

type SubscriptionCardProps = {
    subscription: Subscription
}

const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
    const {
        id,
        status,
        interval,
        period,
        next_order_date,
        subscription_date,
    } = subscription

    return (
        <div className="flex flex-col gap-y-2 border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
                <Text className="text-ui-fg-base font-semibold">
                    {interval === "monthly" ? "Monthly" : "Yearly"} Subscription
                </Text>
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

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <Text className="text-ui-fg-subtle text-small-regular">Started</Text>
                    <Text className="text-ui-fg-base">
                        {format(new Date(subscription_date), "MMM d, yyyy")}
                    </Text>
                </div>
                <div>
                    <Text className="text-ui-fg-subtle text-small-regular">Next Order</Text>
                    <Text className="text-ui-fg-base">
                        {next_order_date
                            ? format(new Date(next_order_date), "MMM d, yyyy")
                            : "-"}
                    </Text>
                </div>
            </div>

            <div className="mt-4">
                <LocalizedClientLink
                    href={`/account/subscriptions/${id}`}
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-small-regular font-semibold"
                >
                    View Details &rarr;
                </LocalizedClientLink>
            </div>
        </div>
    )
}

export default SubscriptionCard
