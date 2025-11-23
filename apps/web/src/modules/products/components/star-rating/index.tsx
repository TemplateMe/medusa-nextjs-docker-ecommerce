"use client"

import React from "react"

type StarRatingProps = {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const displayRating = hoverRating !== null ? hoverRating : rating

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= displayRating
          const isPartiallyFilled =
            starValue > displayRating && starValue - 1 < displayRating

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              className={`${
                interactive
                  ? "cursor-pointer hover:scale-110 transition-transform"
                  : "cursor-default"
              } ${sizeClasses[size]}`}
              aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
            >
              {isPartiallyFilled ? (
                <svg
                  className="text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <defs>
                    <linearGradient id={`grad-${index}`}>
                      <stop
                        offset={`${(displayRating - (starValue - 1)) * 100}%`}
                        stopColor="currentColor"
                      />
                      <stop
                        offset={`${(displayRating - (starValue - 1)) * 100}%`}
                        stopColor="#d1d5db"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#grad-${index})`}
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              ) : (
                <svg
                  className={isFilled ? "text-yellow-400" : "text-gray-300"}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating
