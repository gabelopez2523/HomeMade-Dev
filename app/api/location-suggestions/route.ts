import { NextRequest, NextResponse } from 'next/server'
import zipcodes from 'zipcodes'

interface ZipEntry {
  zip: string
  city: string
  state: string
}

export interface LocationSuggestion {
  label: string  // "Austin, TX"
  city: string
  state: string
  zip: string    // representative zip for the city
}

// GET /api/location-suggestions?q=aust
// Returns up to 6 unique city+state suggestions matching the query.
// Accepts partial city names (>=2 chars) or zip code prefixes (>=3 digits).
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const allCodes = Object.values(zipcodes.codes) as ZipEntry[]
  const isZipSearch = /^\d+$/.test(q)
  const qLower = q.toLowerCase()

  // Count zip codes per city+state — cities with more zips are larger and more notable.
  // This lets Denver, CO (many zips) surface above Denair, CA (1 zip) when typing "den".
  const zipCount = new Map<string, number>()
  const representative = new Map<string, ZipEntry>()

  for (const entry of allCodes) {
    if (!entry.city || !entry.state) continue

    const isMatch = isZipSearch
      ? entry.zip.startsWith(q)
      : entry.city.toLowerCase().startsWith(qLower)

    if (!isMatch) continue

    const key = `${entry.city.toLowerCase()},${entry.state}`
    zipCount.set(key, (zipCount.get(key) ?? 0) + 1)
    if (!representative.has(key)) representative.set(key, entry)
  }

  const matches: LocationSuggestion[] = Array.from(representative.values()).map((entry) => ({
    label: `${entry.city}, ${entry.state}`,
    city: entry.city,
    state: entry.state,
    zip: entry.zip,
  }))

  // Sort: most zip codes first (larger cities), then alphabetically as tiebreaker
  matches.sort((a, b) => {
    const aKey = `${a.city.toLowerCase()},${a.state}`
    const bKey = `${b.city.toLowerCase()},${b.state}`
    const countDiff = (zipCount.get(bKey) ?? 0) - (zipCount.get(aKey) ?? 0)
    return countDiff !== 0 ? countDiff : a.city.localeCompare(b.city)
  })

  return NextResponse.json(matches.slice(0, 6))
}
