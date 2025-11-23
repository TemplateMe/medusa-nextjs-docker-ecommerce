import { 
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { PostStoreCreateWishlistItem } from "./store/customers/me/wishlists/items/validators"
import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
import { z } from 'zod';
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route"
import { GetAdminReviewsSchema } from "./admin/reviews/route"
  
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/customers/me/wishlists/items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostStoreCreateWishlistItem),
      ],
    },
    {
      matcher: "/admin/variants/:id/preorders",
      method: "POST",
      middlewares: [
        validateAndTransformBody(UpsertPreorderVariantSchema),
      ],
    },
    {
      matcher: "/product-feed",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(z.object({
          currency_code: z.string(),
          country_code: z.string(),
        }), {})
      ]
    },
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostInvoiceConfgSchema)
      ]
    },
    {
      matcher: "/store/reviews",
      method: ["POST"], 
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewSchema)
      ]
    }, 
    {
      matcher: "/store/products/:id/reviews",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: ["id", "rating", "title", "first_name", "last_name", "content", "created_at"]
        })
      ]
    },
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ]
        })
      ]
    },
    {
      matcher: "/admin/reviews/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema)
      ]
    }
  ],
})