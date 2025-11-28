import { listSubscriptions } from "@lib/data/subscriptions"
import SubscriptionsTemplate from "@modules/account/templates/subscriptions-template"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Subscriptions",
    description: "View your subscriptions.",
}

export default async function Subscriptions() {
    const subscriptions = await listSubscriptions()

    return <SubscriptionsTemplate subscriptions={subscriptions} />
}
