import { 
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { PostStoreCreateWishlistItem } from "./store/customers/me/wishlists/items/validators"
import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
import { z } from 'zod';
  
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
  }
  ],
})