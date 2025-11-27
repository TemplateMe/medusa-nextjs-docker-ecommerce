"use client"

import { useState, useEffect } from "react"
import { getLoyaltyPoints } from "@lib/data/loyalty"

type LoyaltyConfig = {
  redemption_rate: number
  earning_rate: number
}

export default function LoyaltyPointsCard() {
  const [points, setPoints] = useState(0)
  const [config, setConfig] = useState<LoyaltyConfig>({ redemption_rate: 0.1, earning_rate: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch loyalty points
        const pointsData = await getLoyaltyPoints()
        setPoints(pointsData)

        // Fetch config
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/loyalty/config`,
          {
            headers: {
              "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
          }
        )
        const data = await response.json()
        
        const configData = {
          redemption_rate: parseFloat(data.config.redemption_rate) || 0.1,
          earning_rate: parseFloat(data.config.earning_rate) || 1,
        }
        
        console.log("Loyalty config fetched:", configData)
        setConfig(configData)
      } catch (error) {
        console.error("Failed to fetch loyalty data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const pointsWorth = points * config.redemption_rate
  const earningRate = config.earning_rate

  if (loading) {
    return (
      <div className="flex flex-col gap-y-4">
        <h3 className="text-large-semi">Loyalty Points</h3>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <h3 className="text-large-semi">Loyalty Points</h3>
      <div className="flex items-end gap-x-2">
        <span
          className="text-3xl-semi leading-none"
          data-testid="loyalty-points-balance"
          data-value={points}
        >
          {points.toLocaleString()}
        </span>
        <span className="uppercase text-base-regular text-ui-fg-subtle">
          Points
        </span>
      </div>
      <p className="text-small-regular text-ui-fg-subtle">
        Worth €{pointsWorth.toFixed(2)} • Earn {earningRate} {earningRate === 1 ? 'point' : 'points'} per €1 spent
      </p>
    </div>
  )
}

