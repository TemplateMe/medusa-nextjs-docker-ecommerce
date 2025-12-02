"use client"

import React, { useState } from "react"
import StarRating from "../star-rating"
import ReviewCard from "../review-card"
import ReviewForm from "../review-form"
import { Review } from "@lib/data/reviews"
import { useTranslation } from "@lib/i18n/client"

type ReviewsSectionProps = {
  productId: string
  reviews: Review[]
  ratingStats: {
    averageRating: number
    totalReviews: number
    ratingDistribution: { [key: number]: number }
  }
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  reviews,
  ratingStats,
}) => {
  const { t } = useTranslation()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">(
    "recent"
  )

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "highest":
        return b.rating - a.rating
      case "lowest":
        return a.rating - b.rating
      case "recent":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
  })

  const getPercentage = (count: number) => {
    if (ratingStats.totalReviews === 0) return 0
    return (count / ratingStats.totalReviews) * 100
  }

  const getBasedOnText = () => {
    const count = ratingStats.totalReviews
    if (count === 1) {
      return t("reviews.basedOn", { count })
    }
    return t("reviews.basedOnPlural", { count })
  }

  return (
    <div className="content-container py-12" id="reviews">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          {t("reviews.title")}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Rating Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {ratingStats.averageRating > 0
                    ? ratingStats.averageRating.toFixed(1)
                    : "—"}
                </div>
                <StarRating
                  rating={ratingStats.averageRating}
                  size="lg"
                  showValue={false}
                />
                <p className="text-sm text-gray-600 mt-2">
                  {getBasedOnText()}
                </p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingStats.ratingDistribution[rating] || 0
                  const percentage = getPercentage(count)

                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-3">
                        {rating}
                      </span>
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="w-full mt-6 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                {showReviewForm ? t("reviews.cancel") : t("reviews.writeReview")}
              </button>
            </div>
          </div>

          {/* Review Form or Reviews List */}
          <div className="lg:col-span-2">
            {showReviewForm ? (
              <ReviewForm
                productId={productId}
                onSuccess={() => {
                  setShowReviewForm(false)
                }}
              />
            ) : (
              <div>
                {reviews.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t("reviews.allReviews")} ({reviews.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="sort"
                          className="text-sm text-gray-600"
                        >
                          {t("reviews.sortBy")}
                        </label>
                        <select
                          id="sort"
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(
                              e.target.value as "recent" | "highest" | "lowest"
                            )
                          }
                          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="recent">{t("reviews.mostRecent")}</option>
                          <option value="highest">{t("reviews.highestRating")}</option>
                          <option value="lowest">{t("reviews.lowestRating")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {sortedReviews.map((review) => (
                        <div key={review.id} className="p-6">
                          <ReviewCard review={review} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("reviews.noReviews")}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t("reviews.noReviewsDescription")}
                    </p>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {t("reviews.writeFirstReview")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewsSection
