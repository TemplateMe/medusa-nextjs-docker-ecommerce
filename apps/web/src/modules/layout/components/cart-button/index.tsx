import { retrieveCart } from "@lib/data/cart"
import CartDropdown from "../cart-dropdown"
import type { Dictionary } from "@lib/i18n"

interface CartButtonProps {
  dictionary: Dictionary
}

export default async function CartButton({ dictionary }: CartButtonProps) {
  const cart = await retrieveCart().catch(() => null)

  return <CartDropdown cart={cart} dictionary={dictionary} />
}
