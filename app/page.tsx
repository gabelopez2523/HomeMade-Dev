'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LocationSearch } from '@/components/LocationSearch'

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
          <span className="text-2xl font-bold text-primary-600">
            ${listing.price.toFixed(2)}
          </span>
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
  const [loading, setLoading] = useState(false)
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [zipCode, setZipCode] = useState('')
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (zipCode) {
      fetchListings(zipCode, query)
      fetchNearbyListings(zipCode, query)
    }
  }, [zipCode, query])

  const fetchListings = async (zip: string, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        onlyActive: 'true',
        zipCode: zip,
      })
      if (q.trim()) {
        params.set('q', q.trim())
      }
      const response = await fetch(`/api/listings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const fetchNearbyListings = async (zip: string, q: string) => {
    setLoadingNearby(true)
    try {
      const params = new URLSearchParams({
        onlyActive: 'true',
        nearZip: zip,
        radius: '25',
        excludeZip: zip,
      })
      if (q.trim()) {
        params.set('q', q.trim())
      }
      const response = await fetch(`/api/listings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNearbyListings(data)
      }
    } catch (error) {
      console.error('Error fetching nearby listings:', error)
    } finally {
      setLoadingNearby(false)
    }
  }

  const handleLocationChange = (zip: string) => {
    setZipCode(zip)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Discover Local Homemade Food
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Find homemade meals from local cooks near you
        </p>
        <div className="mb-4">
          <label htmlFor="food-search" className="block text-sm font-medium text-gray-700 mb-1">
            Search for a food
          </label>
          <input
            id="food-search"
            type="text"
            placeholder="e.g. lasagna, tamales, banana bread"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full md:w-1/3 rounded-md border border-gray-300 px-3 py-2 text-black placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <LocationSearch onLocationChange={handleLocationChange} currentZip={zipCode} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading listings...</p>
        </div>
      ) : !searched ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Enter your zip code or use your location to find homemade food nearby.
          </p>
        </div>
      ) : (
        <>
          {/* Exact zip code listings */}
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No food listings found in your zip code.
              </p>
            </div>
          ) : (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                In Your Area ({zipCode})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

          {/* Nearby listings within 25 miles */}
          {loadingNearby ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading nearby listings...</p>
            </div>
          ) : nearbyListings.length > 0 && (
            <div className="mt-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Foods Near You
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Listings within 25 miles of {zipCode}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
