'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

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
  isActive: boolean
  seller: {
    user: {
      name: string
    }
    bio: string | null
    city: string | null
    state: string | null
    phone: string | null
    contactEmail: string | null
    profilePictureUrl: string | null
  }
}

export default function ListingDetail() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<FoodListing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setListing(data)
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Listing not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 text-primary-600 hover:text-primary-700"
      >
        &larr; Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {listing.imageUrl && (
          <div className="relative h-96 w-full">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {listing.title}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            by {listing.seller.user.name}
          </p>

          {listing.description && (
            <p className="text-gray-700 mb-6">{listing.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
              <p className="text-3xl font-bold text-primary-600">
                ${listing.price.toFixed(2)}
              </p>
            </div>
            {listing.city && listing.state && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-lg text-gray-900">
                  {listing.city}, {listing.state}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Pickup Time
              </h3>
              <p className="text-lg text-gray-900">
                {new Date(listing.pickupTime).toLocaleString()}
              </p>
            </div>
            {listing.pickupLocation && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Pickup Location
                </h3>
                <p className="text-lg text-gray-900">
                  {listing.pickupLocation}
                </p>
              </div>
            )}
          </div>

          {listing.seller.bio && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                About the Seller
              </h3>
              <p className="text-gray-700">{listing.seller.bio}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact the Seller
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-gray-900 font-medium">
                {listing.seller.user.name}
              </p>
              {listing.seller.phone && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Phone:</span>
                  <a
                    href={`tel:${listing.seller.phone}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {listing.seller.phone}
                  </a>
                </div>
              )}
              {listing.seller.contactEmail && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Email:</span>
                  <a
                    href={`mailto:${listing.seller.contactEmail}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {listing.seller.contactEmail}
                  </a>
                </div>
              )}
              {!listing.seller.phone && !listing.seller.contactEmail && (
                <p className="text-gray-500 text-sm">
                  This seller has not provided contact information yet.
                </p>
              )}
              {listing.seller.city && listing.seller.state && (
                <p className="text-sm text-gray-500">
                  Seller location: {listing.seller.city}, {listing.seller.state}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
