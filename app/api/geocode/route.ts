import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'lat and lon query parameters are required' },
      { status: 400 }
    )
  }

  try {
    // Try BigDataCloud first (more reliable for US zip codes)
    const bdcResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`
    )

    if (bdcResponse.ok) {
      const bdcData = await bdcResponse.json()
      const postcode = bdcData.postcode || null
      const city = bdcData.city || bdcData.locality || null
      const state = bdcData.principalSubdivision || null

      if (postcode) {
        // Extract just the 5-digit zip if it contains a hyphen (e.g., "87505-1234")
        const zip = postcode.split('-')[0]
        return NextResponse.json({ zipCode: zip, city, state })
      }
    }

    // Fallback to Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeMade-App/1.0',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding service error' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const address = data.address || {}
    const postcode = address.postcode || address['postal_code'] || null
    const zip = postcode ? postcode.split('-')[0] : null

    return NextResponse.json({
      zipCode: zip,
      city: address.city || address.town || address.village || address.county || null,
      state: address.state || null,
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    )
  }
}
