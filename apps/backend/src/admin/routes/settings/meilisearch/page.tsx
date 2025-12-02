import { Container, Heading, Button, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { sdk } from "../../../lib/sdk"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useTranslation } from "react-i18next"

const MeilisearchPage = () => {
  const { t } = useTranslation()
  const { mutate, isPending } = useMutation({
    mutationFn: () => 
      sdk.client.fetch("/admin/meilisearch/sync", {
        method: "POST"
      }),
    onSuccess: () => {
      toast.success(t("meilisearch.syncSuccess")) 
    },
    onError: (err) => {
      console.error(err)
      toast.error(t("meilisearch.syncError")) 
    }
  })

  const handleSync = () => {
    mutate()
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("meilisearch.title")}</Heading>
      </div>
      <div className="px-6 py-8">
        <Button 
          variant="primary"
          onClick={handleSync}
          isLoading={isPending}
        >
          {t("meilisearch.syncButton")}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Meilisearch",
})

export default MeilisearchPage