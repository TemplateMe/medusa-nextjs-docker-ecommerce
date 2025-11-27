import { useState } from "react"
import {
  Button,
  Input,
  Label,
  Textarea,
  toast,
  Heading,
  Text,
  Badge,
} from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"
import * as Dialog from "@radix-ui/react-dialog"
import { XMark } from "@medusajs/icons"

type LoyaltyPoint = {
  id: string
  customer_id: string
  points: number
  customer?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

type AdjustPointsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: LoyaltyPoint
  onSuccess: () => void
}

const AdjustPointsDialog = ({ 
  open, 
  onOpenChange, 
  customer, 
  onSuccess 
}: AdjustPointsDialogProps) => {
  const [pointsChange, setPointsChange] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const adjustMutation = useMutation({
    mutationFn: async (data: { customer_id: string; points: number; reason: string }) => {
      return sdk.client.fetch("/admin/loyalty/adjust", {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      onSuccess()
      setPointsChange("")
      setReason("")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to adjust points")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const points = parseInt(pointsChange)
    if (isNaN(points) || points === 0) {
      toast.error("Please enter a valid point amount")
      return
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the adjustment")
      return
    }

    // Check if deducting more points than available
    if (points < 0 && Math.abs(points) > customer.points) {
      toast.error(`Cannot deduct ${Math.abs(points)} points. Customer only has ${customer.points} points.`)
      return
    }

    adjustMutation.mutate({
      customer_id: customer.customer_id,
      points,
      reason: reason.trim(),
    })
  }

  const customerName = customer.customer?.first_name && customer.customer?.last_name
    ? `${customer.customer.first_name} ${customer.customer.last_name}`
    : customer.customer?.email || "Unknown Customer"

  const newBalance = customer.points + (parseInt(pointsChange) || 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title asChild>
                <Heading level="h2">Adjust Loyalty Points</Heading>
              </Dialog.Title>
              <Dialog.Description asChild>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  {customerName}
                </Text>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="transparent" className="p-1">
                <XMark />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mb-4 p-3 bg-ui-bg-subtle rounded-md">
            <div className="flex items-center justify-between">
              <Text size="small" className="text-ui-fg-subtle">Current Balance:</Text>
              <Badge color="blue">{customer.points.toLocaleString()} pts</Badge>
            </div>
            {pointsChange && !isNaN(parseInt(pointsChange)) && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-ui-border-base">
                <Text size="small" className="text-ui-fg-subtle">New Balance:</Text>
                <Badge color={newBalance >= 0 ? "green" : "red"}>
                  {newBalance.toLocaleString()} pts
                </Badge>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="points" className="mb-2">
                Points Adjustment
                <Text size="xsmall" className="text-ui-fg-subtle ml-1">
                  (Use negative numbers to deduct)
                </Text>
              </Label>
              <Input
                id="points"
                type="number"
                placeholder="e.g., 100 or -50"
                value={pointsChange}
                onChange={(e) => setPointsChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="reason" className="mb-2">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment (e.g., Customer service compensation, Promotional bonus, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adjustMutation.isPending}
              >
                {adjustMutation.isPending ? "Adjusting..." : "Apply Adjustment"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default AdjustPointsDialog
