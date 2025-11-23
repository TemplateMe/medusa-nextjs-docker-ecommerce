"use client"

import React, { useState } from "react"
import { Button } from "@medusajs/ui"
import StarRating from "../star-rating"
import { createReview } from "@lib/data/reviews"
import Input from "@modules/common/components/input"
import Textarea from "@modules/common/components/textarea"

type ReviewFormProps = {
  productId: string
  onSuccess?: () => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const [rating, setRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const firstName = formData.get("first_name") as string
    const lastName = formData.get("last_name") as string

    if (rating === 0) {
      setError("Please select a rating")
      setIsSubmitting(false)
      return
    }

    if (!content.trim()) {
      setError("Please write a review")
      setIsSubmitting(false)
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please provide your name")
      setIsSubmitting(false)
      return
    }

    const result = await createReview({
      product_id: productId,
      title: title || undefined,
      content,
      rating,
      first_name: firstName,
      last_name: lastName,
    })

    setIsSubmitting(false)

    if (result.success) {
      setSuccess(true)
      setRating(0)
      ;(e.target as HTMLFormElement).reset()
      
      if (onSuccess) {
        onSuccess()
      }

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } else {
      setError(result.error || "Failed to submit review")
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Write a Review
      </h3>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Thank you for your review! It will be published after approval.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <StarRating
            rating={rating}
            interactive
            onRatingChange={setRating}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="First Name"
              name="first_name"
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <Input
              label="Last Name"
              name="last_name"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <Input
            label="Review Title (Optional)"
            name="title"
            autoComplete="off"
          />
        </div>

        <div>
          <Textarea
            label="Your Review"
            name="content"
            required
            rows={5}
            placeholder="Share your thoughts about this product..."
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  )
}

export default ReviewForm
