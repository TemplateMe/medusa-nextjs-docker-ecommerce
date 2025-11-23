import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid query parameter" },
        { status: 400 }
      )
    }

    // Use the internal Docker network URL for server-side requests
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://medusa:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      return NextResponse.json(
        { error: "Publishable API key not configured" },
        { status: 500 }
      )
    }
    
    const response = await fetch(`${backendUrl}/store/products/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend search error:", errorText)
      return NextResponse.json(
        { error: "Search failed", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
