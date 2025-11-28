import { getSubscription } from "@lib/data/subscriptions"
import SubscriptionDetailsTemplate from "@modules/account/templates/subscription-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
    title: "Subscription Details",
    description: "View subscription details.",
}

type Props = {
    params: { id: string }
}

export default async function SubscriptionDetails({ params }: Props) {
    const subscription = await getSubscription(params.id)

    if (!subscription) {
        notFound()
    }

    return <SubscriptionDetailsTemplate subscription={subscription} />
}
