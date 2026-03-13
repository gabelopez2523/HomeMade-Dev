'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface FoodListing {
  id: string
  title: string
  description: string | null
  price: number
  imageUrl: string | null
  imageUrls: string[]
  listingDate: string
  pickupTime: string
  pickupLocation: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  servingDescription: string | null
  isActive: boolean
  seller: {
    user: {
      name: string
    }
    bio: string | null
    city: string | null
    state: string | null
    profilePictureUrl: string | null
  }
}

function InquiryForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', buyerPhone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, ...form }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
        <p className="font-medium">Message sent!</p>
        <p className="text-sm mt-1">The seller will be in touch with you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Your Name</label>
          <input
            type="text"
            required
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Your Email</label>
          <input
            type="email"
            required
            value={form.buyerEmail}
            onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
            placeholder="jane@example.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Callback Number <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={form.buyerPhone}
          onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Message</label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          rows={4}
          placeholder="Hi! I'm interested in placing an order. Is this still available?"
          maxLength={2000}
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}

export default function ListingDetail() {
  const params = useParams()
  const [listing, setListing] = useState<FoodListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

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
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {(() => {
          const allImages = listing.imageUrls?.length
            ? listing.imageUrls
            : listing.imageUrl
            ? [listing.imageUrl]
            : []
          if (!allImages.length) return null
          return (
            <div>
              <div className="relative h-96 w-full">
                <Image
                  src={allImages[activeImageIndex]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 bg-gray-50 overflow-x-auto">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-colors ${
                        i === activeImageIndex ? 'border-primary-500' : 'border-transparent'
                      }`}
                    >
                      <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

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
              <h3 className="text-sm font-medium text-gray-500 mb-1">Price per Order</h3>
              <p className="text-3xl font-bold text-primary-600">
                ${listing.price.toFixed(2)}
              </p>
              {listing.servingDescription && (
                <p className="text-sm text-gray-500 mt-1">{listing.servingDescription}</p>
              )}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Contact the Seller
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Send {listing.seller.user.name} a message — your contact info stays private.
            </p>
            <InquiryForm listingId={listing.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
