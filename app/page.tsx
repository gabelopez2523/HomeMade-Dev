'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '@/components/SearchBar'

interface FoodListing {
  id: string
  title: string
  description: string | null
  price: number
  imageUrl: string | null
  listingDate: string
  pickupTime: string
  pickupLocation: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  category: string | null
  servingDescription: string | null
  seller: {
    user: {
      name: string
    }
  }
}

function ListingCard({ listing }: { listing: FoodListing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {listing.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {listing.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          by {listing.seller.user.name}
        </p>
        {listing.description && (
          <p className="text-gray-700 mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-primary-600">
              ${listing.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">/ order</span>
            {listing.servingDescription && (
              <p className="text-xs text-gray-500 mt-0.5">{listing.servingDescription}</p>
            )}
          </div>
          {listing.city && listing.state && (
            <span className="text-sm text-gray-500">
              {listing.city}, {listing.state}
            </span>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Pickup: {new Date(listing.pickupTime).toLocaleString()}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [listings, setListings] = useState<FoodListing[]>([])
  const [nearbyListings, setNearbyListings] = useState<FoodListing[]>([])
  const [suggestions, setSuggestions] = useState<FoodListing[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [autoDetecting, setAutoDetecting] = useState(true)
  const [detectedLocation, setDetectedLocation] = useState('')
  const [detectedZip, setDetectedZip] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [initLoc, setInitLoc] = useState('')
  const [initQuery, setInitQuery] = useState('')

  const performSearch = useCallback(async (location: string, query: string) => {
    // If the user hasn't changed the display location, use the detected zip for API calls
    const effectiveLocation = (!location || location === detectedLocation)
      ? detectedZip
      : location
    if (!effectiveLocation && !query) return

    // Persist search state in the URL and sessionStorage so Back navigation restores results
    const urlParams = new URLSearchParams()
    if (location || effectiveLocation) urlParams.set('location', location || effectiveLocation)
    if (query) urlParams.set('q', query)
    const returnUrl = urlParams.toString() ? `/?${urlParams}` : '/'
    window.history.replaceState(null, '', returnUrl)
    sessionStorage.setItem('searchReturn', returnUrl)

    setLoading(true)
    setSearched(true)
    setSearchLocation(detectedLocation || effectiveLocation)

    try {
      // Primary search: exact location
      const params = new URLSearchParams({ onlyActive: 'true' })
      if (effectiveLocation) params.set('location', effectiveLocation)
      if (query) params.set('q', query)

      // Nearby search: 25mi radius
      const nearbyParams = new URLSearchParams({ onlyActive: 'true' })
      if (effectiveLocation) {
        nearbyParams.set('location', effectiveLocation)
        nearbyParams.set('nearby', 'true')
        nearbyParams.set('radius', '25')
      }
      if (query) {
        nearbyParams.set('q', query)
        nearbyParams.set('suggestCategory', 'true')
      }

      const [primaryRes, nearbyRes] = await Promise.all([
        fetch(`/api/listings?${params}`),
        effectiveLocation ? fetch(`/api/listings?${nearbyParams}`) : Promise.resolve(null),
      ])

      if (primaryRes.ok) {
        const primaryData = await primaryRes.json()
        setListings(Array.isArray(primaryData) ? primaryData : primaryData.listings ?? [])
      }

      if (nearbyRes?.ok) {
        const nearbyData = await nearbyRes.json()
        if (Array.isArray(nearbyData)) {
          setNearbyListings(nearbyData)
          setSuggestions([])
        } else {
          setNearbyListings(nearbyData.listings ?? [])
          setSuggestions(nearbyData.suggestions ?? [])
        }
      } else {
        setNearbyListings([])
        setSuggestions([])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [detectedZip, detectedLocation])

  const handleSearch = useCallback(({ location, query }: { location: string; query: string }) => {
    performSearch(location, query)
  }, [performSearch])

  // Restore search from URL params on mount (e.g. when pressing Back from a listing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location') || ''
    const q = params.get('q') || ''
    if (loc || q) {
      setInitLoc(loc)
      setInitQuery(q)
      performSearch(loc, q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setAutoDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          const data = await res.json()
          if (data.zipCode) {
            setDetectedZip(data.zipCode)
            const display = data.city && data.state
              ? `${data.city}, ${data.state}`
              : data.zipCode
            setDetectedLocation(display)
          }
        } catch {
          // Ignore — user can manually enter location
        } finally {
          setAutoDetecting(false)
        }
      },
      () => {
        setAutoDetecting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 300000,
      }
    )
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Discover Local Homemade Food
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Find homemade meals from local cooks near you
        </p>
        <SearchBar
          onSearch={handleSearch}
          detectedLocation={detectedLocation}
          detecting={autoDetecting}
          initialLocation={initLoc}
          initialQuery={initQuery}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading listings...</p>
        </div>
      ) : !searched ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Enter a location and search for homemade food nearby.
          </p>
        </div>
      ) : (
        <>
          {/* Exact location listings */}
          {listings.length === 0 && nearbyListings.length === 0 && suggestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No food listings found in this area.
              </p>
            </div>
          ) : (
            <>
              {listings.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    In Your Area {searchLocation && `(${searchLocation})`}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby listings within 25 miles */}
              {nearbyListings.length > 0 && (
                <div className="mt-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Foods Near You
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      Listings within 25 miles {searchLocation && `of ${searchLocation}`}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nearbyListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Category-based suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-8">
                  <div className="bg-amber-50 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Similar Foods Nearby
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      We couldn&apos;t find an exact match, but here are similar items in the same category
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suggestions.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
