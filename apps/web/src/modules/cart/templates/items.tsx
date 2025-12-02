"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"
import { Fragment } from "react"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { useTranslation } from "@lib/i18n"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const { t } = useTranslation()
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">{t("cart.title")}</Heading>
      </div>
      <Table>
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">{t("cart.item")}</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>{t("cart.quantity")}</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              {t("cart.price")}
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              {t("cart.total")}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items && items.length > 0 ? (
            Object.values(
              items.reduce((acc, item) => {
                const bundleId = item.metadata?.bundle_id as string | undefined

                if (bundleId) {
                  if (!acc[bundleId]) {
                    acc[bundleId] = {
                      id: bundleId,
                      isBundle: true,
                      items: [],
                      created_at: item.created_at,
                    }
                  }
                  acc[bundleId].items.push(item)
                  // Update created_at to the latest item in the bundle
                  if (
                    item.created_at &&
                    acc[bundleId].created_at &&
                    item.created_at > acc[bundleId].created_at!
                  ) {
                    acc[bundleId].created_at = item.created_at
                  }
                } else {
                  acc[item.id] = {
                    id: item.id,
                    isBundle: false,
                    items: [item],
                    created_at: item.created_at,
                  }
                }
                return acc
              }, {} as Record<string, { id: string; isBundle: boolean; items: HttpTypes.StoreCartLineItem[]; created_at?: string | Date }>)
            )
              .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                return dateB - dateA
              })
              .map((group) => {
                return (
                  <Fragment key={group.id}>
                    {group.isBundle && (
                      <Table.Row className="bg-ui-bg-subtle hover:bg-ui-bg-subtle">
                        <Table.Cell {...({ colSpan: 5 } as any)} className="p-4">
                          <div className="flex items-center gap-x-2">
                            <span className="text-ui-fg-base font-medium">
                              {t("bundles.bundle")}
                            </span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                    {group.items
                      .sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                        return dateB - dateA
                      })
                      .map((item) => {
                        return (
                          <Item
                            key={item.id}
                            item={item}
                            currencyCode={cart?.currency_code}
                            className={group.isBundle ? "bg-ui-bg-subtle" : ""}
                          />
                        )
                      })}
                  </Fragment>
                )
              })
          ) : (
            repeat(5).map((i) => {
              return <SkeletonLineItem key={i} />
            })
          )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
