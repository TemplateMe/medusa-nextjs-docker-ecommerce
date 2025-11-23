"use client"

import React from "react"
import StarRating from "../star-rating"
import { Review } from "@lib/data/reviews"

type ReviewCardProps = {
  review: Review
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const reviewerName = `${review.first_name} ${review.last_name}`
  
  // Format date in a way that's consistent across server/client
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm font-medium text-gray-900">
              {review.rating.toFixed(1)}
            </span>
          </div>
          {review.title && (
            <h4 className="text-base font-semibold text-gray-900 mt-2">
              {review.title}
            </h4>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {review.content}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">{reviewerName}</span>
        <span>•</span>
        <time dateTime={review.created_at} suppressHydrationWarning>
          {formatReviewDate(review.created_at)}
        </time>
      </div>
    </div>
  )
}

export default ReviewCard
