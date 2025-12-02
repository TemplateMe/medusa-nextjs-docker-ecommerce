import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Text, 
  Button, 
  Drawer,
  Label,
  DatePicker,
  DropdownMenu,
  IconButton,
  clx,
  usePrompt,
  StatusBadge,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { 
  DetailWidgetProps, 
  AdminProductVariant,
} from "@medusajs/framework/types"
import { Calendar, EllipsisHorizontal, Pencil, Plus, XCircle } from "@medusajs/icons"
import { usePreorderVariant } from "../hooks/use-preorder-variant"
import { useTranslation } from "react-i18next"

const PreorderWidget = ({ 
  data: variant,
}: DetailWidgetProps<AdminProductVariant>) => {
  const { t } = useTranslation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [availableDate, setAvailableDate] = useState(
    new Date().toString()
  )

  const dialog = usePrompt()

  const {
    preorderVariant,
    isLoading,
    upsertPreorder: createPreorder,
    disablePreorder: deletePreorder,
    isUpserting: isCreating,
    isDisabling,
  } = usePreorderVariant(variant)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!availableDate) {
      return
    }

    createPreorder(
      { available_date: new Date(availableDate) },
      {
        onSuccess: () => {
          setIsDrawerOpen(false)
          setAvailableDate(new Date().toString())
        },
      }
    )
  }

  const handleDisable = async () => {
    const confirmed = await dialog({
      title: t("preorder.removeConfiguration"),
      description: t("preorder.setupDescription"),
      variant: "danger",
    })
    if (confirmed) {
      deletePreorder()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    if (preorderVariant) {
      setAvailableDate(preorderVariant.available_date)
    } else {
      setAvailableDate(new Date().toString())
    }
  }, [preorderVariant])

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heading level="h2">{t("preorder.title")}</Heading>
            {preorderVariant?.status === "enabled" && (
              <StatusBadge color={"green"}>
                {t("common.enabled")}
              </StatusBadge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton size="small" variant="transparent">
                <EllipsisHorizontal />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                disabled={isCreating || isDisabling}
                onClick={() => setIsDrawerOpen(true)}
                className={clx(
                  "[&_svg]:text-ui-fg-subtle flex items-center gap-x-2",
                  {
                    "[&_svg]:text-ui-fg-disabled": isCreating || isDisabling,
                  }
                )}
              >
                { preorderVariant ? <Pencil /> : <Plus />}
                <span>
                  { preorderVariant ? t("common.edit") : t("common.add") } {t("preorder.configuration")}
                </span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={isCreating || isDisabling || !preorderVariant}
                onClick={handleDisable}
                className={clx(
                  "[&_svg]:text-ui-fg-subtle flex items-center gap-x-2",
                  {
                    "[&_svg]:text-ui-fg-disabled": isCreating || isDisabling || !preorderVariant,
                  }
                )}
              >
                <XCircle />
                <span>
                  {t("preorder.removeConfiguration")}
                </span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>

          </DropdownMenu>
        </div>
        
        <div className="px-6 py-4">
          {isLoading ? (
            <Text>{t("preorder.loadingInfo")}</Text>
          ) : preorderVariant ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-ui-fg-subtle">
                <Calendar className="w-4 h-4" />
                <Text size="small">
                  {t("preorder.available")}: {formatDate(preorderVariant.available_date)}
                </Text>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Text className="text-ui-fg-subtle">
                {t("preorder.notConfigured")}
              </Text>
              <Text size="small" className="text-ui-fg-muted mt-1">
                {t("preorder.setupDescription")}
              </Text>
            </div>
          )}
        </div>
      </Container>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {preorderVariant ? t("common.edit") : t("common.add")} {t("preorder.configuration")}
            </Drawer.Title>
          </Drawer.Header>
          
          <Drawer.Body>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="available-date">{t("preorder.availableDate")}</Label>
                <DatePicker
                  id="available-date"
                  value={new Date(availableDate)}
                  onChange={(date) => setAvailableDate(date?.toString() || "")}
                  minValue={new Date()}
                  isRequired={true}
                />
                <Text size="small" className="text-ui-fg-subtle">
                  {t("preorder.availableDateDescription")}
                </Text>
              </div>
            </form>
          </Drawer.Body>

          <Drawer.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setIsDrawerOpen(false)}
              disabled={isCreating}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              isLoading={isCreating}
            >
              {t("common.save")}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
})

export default PreorderWidget