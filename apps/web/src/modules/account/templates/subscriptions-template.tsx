import { Subscription } from "@lib/data/subscriptions"
import { Heading, Text } from "@medusajs/ui"
import SubscriptionCard from "../components/subscription-card"

type SubscriptionsTemplateProps = {
    subscriptions: Subscription[] | null
}

const SubscriptionsTemplate = ({ subscriptions }: SubscriptionsTemplateProps) => {
    return (
        <div className="w-full" data-testid="subscriptions-page">
            <div className="mb-8 flex flex-col gap-y-4">
                <Heading level="h1" className="text-2xl-semi">
                    Subscriptions
                </Heading>
                <Text className="text-base-regular">
                    View and manage your active subscriptions.
                </Text>
            </div>
            <div>
                {subscriptions && subscriptions.length > 0 ? (
                    <div className="flex flex-col gap-y-4">
                        {subscriptions.map((s) => (
                            <SubscriptionCard key={s.id} subscription={s} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full py-12">
                        <Text className="text-base-regular text-ui-fg-subtle">
                            You don&apos;t have any subscriptions yet.
                        </Text>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubscriptionsTemplate
