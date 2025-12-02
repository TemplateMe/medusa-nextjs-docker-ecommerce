"use client"

import React, { useState } from "react"
import { Button } from "@medusajs/ui"
import StarRating from "../star-rating"
import { createReview } from "@lib/data/reviews"
import Input from "@modules/common/components/input"
import Textarea from "@modules/common/components/textarea"
import { useTranslation } from "@lib/i18n/client"

type ReviewFormProps = {
  productId: string
  onSuccess?: () => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const { t } = useTranslation()
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
      setError(t("reviews.pleaseSelectRating"))
      setIsSubmitting(false)
      return
    }

    if (!content.trim()) {
      setError(t("reviews.pleaseWriteReview"))
      setIsSubmitting(false)
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError(t("reviews.pleaseProvideName"))
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
      setError(result.error || t("reviews.failedToSubmit"))
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("reviews.writeReview")}
      </h3>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            {t("reviews.thankYou")}
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
            {t("reviews.rating")} <span className="text-red-500">*</span>
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
              label={t("reviews.firstName")}
              name="first_name"
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <Input
              label={t("reviews.lastName")}
              name="last_name"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <Input
            label={t("reviews.reviewTitle")}
            name="title"
            autoComplete="off"
          />
        </div>

        <div>
          <Textarea
            label={t("reviews.yourReview")}
            name="content"
            required
            rows={5}
            placeholder={t("reviews.reviewPlaceholder")}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("reviews.submitting") : t("reviews.submitReview")}
        </Button>
      </form>
    </div>
  )
}

export default ReviewForm
