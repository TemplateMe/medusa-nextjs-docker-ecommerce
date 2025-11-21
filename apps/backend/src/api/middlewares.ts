import { 
    defineMiddlewares,
    validateAndTransformBody,
  } from "@medusajs/framework/http"
  import { PostStoreCreateWishlistItem } from "./store/customers/me/wishlists/items/validators"
  import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
  
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
    ],
  })