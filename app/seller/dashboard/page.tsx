'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SellerProfile {
  id: string
  bio: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  contactEmail: string | null
  profilePictureUrl: string | null
  user: {
    name: string
    email: string
  }
}

interface FoodListing {
  id: string
  title: string
  price: number
  isActive: boolean
  pickupTime: string
  city: string | null
  state: string | null
  createdAt: string
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [listings, setListings] = useState<FoodListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'profile'>('listings')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (session?.user) {
      fetchData()
    }
  }, [session, status])

  const fetchData = async () => {
    try {
      const [profileRes, listingsRes] = await Promise.all([
        fetch('/api/seller/profile'),
        fetch('/api/listings?sellerId=current'),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData)
      }

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json()
        setListings(listingsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
        </nav>
      </div>

      {activeTab === 'listings' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">My Food Listings</h2>
            <Link
              href="/seller/listings/new"
              className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
            >
              + New Listing
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">
                You haven&apos;t created any listings yet.
              </p>
              <Link
                href="/seller/listings/new"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {listing.title}
                    </h3>
                    {!listing.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary-600 mb-2">
                    ${listing.price.toFixed(2)}
                  </p>
                  {listing.city && listing.state && (
                    <p className="text-sm text-gray-500 mb-2">
                      {listing.city}, {listing.state}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    Pickup: {new Date(listing.pickupTime).toLocaleString()}
                  </p>
                  <Link
                    href={`/seller/listings/${listing.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View/Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <ProfileTab profile={profile} onUpdate={fetchData} />
      )}
    </div>
  )
}

function ProfileTab({
  profile,
  onUpdate,
}: {
  profile: SellerProfile | null
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zipCode: profile?.zipCode || '',
    phone: profile?.phone || '',
    contactEmail: profile?.contactEmail || '',
    profilePictureUrl: profile?.profilePictureUrl || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        {profile && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.user.name}
              </h3>
              <p className="text-gray-600">{profile.user.email}</p>
            </div>

            {!editing ? (
              <>
                {profile.bio && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}
                {(profile.city || profile.state || profile.zipCode) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                    <p className="text-gray-700">
                      {[profile.city, profile.state, profile.zipCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {profile.phone && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                    <p className="text-gray-700">{profile.phone}</p>
                  </div>
                )}
                {profile.contactEmail && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Email</h4>
                    <p className="text-gray-700">{profile.contactEmail}</p>
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={formData.profilePictureUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, profilePictureUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        bio: profile?.bio || '',
                        city: profile?.city || '',
                        state: profile?.state || '',
                        zipCode: profile?.zipCode || '',
                        phone: profile?.phone || '',
                        contactEmail: profile?.contactEmail || '',
                        profilePictureUrl: profile?.profilePictureUrl || '',
                      })
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
