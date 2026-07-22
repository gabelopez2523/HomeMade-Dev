'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
  price: string | number
  isActive: boolean
  soldAt: string | null
  pickupTime: string
  city: string | null
  state: string | null
  createdAt: string
}

interface Inquiry {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  message: string
  isRead: boolean
  createdAt: string
  listing: {
    id: string
    title: string
  }
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [listings, setListings] = useState<FoodListing[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'inquiries' | 'profile'>('listings')

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
      const [profileRes, listingsRes, inquiriesRes] = await Promise.all([
        fetch('/api/seller/profile'),
        fetch('/api/listings?sellerId=current'),
        fetch('/api/inquiries'),
      ])

      if (profileRes.ok) {
        setProfile(await profileRes.json())
      }
      if (listingsRes.ok) {
        setListings(await listingsRes.json())
      }
      if (inquiriesRes.ok) {
        setInquiries(await inquiriesRes.json())
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

  const unreadCount = inquiries.filter((i) => !i.isRead).length
  const now = new Date()
  const activeListings = listings.filter(
    (l) => l.isActive && !l.soldAt && new Date(l.pickupTime) > now
  )
  const soldListings = listings.filter((l) => l.soldAt !== null)
  const pastListings = listings.filter(
    (l) => !l.soldAt && new Date(l.pickupTime) <= now
  )

  const markSold = async (id: string, sold: boolean) => {
    await fetch(`/api/listings/${id}/sold`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sold }),
    })
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, soldAt: sold ? new Date().toISOString() : null } : l))
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(
            [
              { key: 'listings', label: 'My Listings' },
              {
                key: 'inquiries',
                label: (
                  <span className="flex items-center gap-2">
                    Inquiries
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-primary-600 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                ),
              },
              { key: 'profile', label: 'Profile' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'listings' && (
        <div>
          <div className="flex justify-between items-center mb-6">
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
            <div className="space-y-10">
              <ListingSection
                title="Active"
                listings={activeListings}
                emptyText="No active listings."
                onMarkSold={(id) => markSold(id, true)}
                showSoldButton
              />
              <ListingSection
                title="Past"
                listings={pastListings}
                emptyText="No past listings."
              />
              <ListingSection
                title="Sold"
                listings={soldListings}
                emptyText="No sold listings yet."
                onMarkUnsold={(id) => markSold(id, false)}
                showUnsoldButton
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <InquiriesTab
          inquiries={inquiries}
          onMarkRead={(id) => {
            setInquiries((prev) =>
              prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
            )
          }}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTab profile={profile} onUpdate={fetchData} />
      )}
    </div>
  )
}

function ListingSection({
  title,
  listings,
  emptyText,
  onMarkSold,
  onMarkUnsold,
  showSoldButton,
  showUnsoldButton,
}: {
  title: string
  listings: FoodListing[]
  emptyText: string
  onMarkSold?: (id: string) => void
  onMarkUnsold?: (id: string) => void
  showSoldButton?: boolean
  showUnsoldButton?: boolean
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-gray-400">({listings.length})</span>
      </h3>
      {listings.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold text-gray-900 leading-snug">
                  {listing.title}
                </h4>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  {listing.soldAt && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Sold
                    </span>
                  )}
                  {!listing.isActive && !listing.soldAt && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xl font-bold text-primary-600 mb-1">
                ${Number(listing.price).toFixed(2)}
              </p>
              {listing.city && listing.state && (
                <p className="text-sm text-gray-500 mb-1">
                  {listing.city}, {listing.state}
                </p>
              )}
              <p className="text-sm text-gray-500 mb-4">
                Pickup: {new Date(listing.pickupTime).toLocaleString()}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/seller/listings/${listing.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View/Edit
                </Link>
                {showSoldButton && onMarkSold && (
                  <button
                    onClick={() => onMarkSold(listing.id)}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Mark as Sold
                  </button>
                )}
                {showUnsoldButton && onMarkUnsold && (
                  <button
                    onClick={() => onMarkUnsold(listing.id)}
                    className="text-sm text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Unmark Sold
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InquiriesTab({
  inquiries,
  onMarkRead,
}: {
  inquiries: Inquiry[]
  onMarkRead: (id: string) => void
}) {
  const markRead = async (id: string) => {
    await fetch(`/api/inquiries/${id}`, { method: 'PATCH' })
    onMarkRead(id)
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Inquiries</h2>

      {inquiries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No inquiries yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            When buyers send you messages, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                inquiry.isRead ? 'border-gray-200' : 'border-primary-500'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{inquiry.buyerName}</p>
                    {!inquiry.isRead && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    <a
                      href={`mailto:${inquiry.buyerEmail}`}
                      className="text-primary-600 hover:underline"
                    >
                      {inquiry.buyerEmail}
                    </a>
                    {inquiry.buyerPhone && (
                      <>
                        {' · '}
                        <a
                          href={`tel:${inquiry.buyerPhone}`}
                          className="text-primary-600 hover:underline"
                        >
                          {inquiry.buyerPhone}
                        </a>
                      </>
                    )}
                    {' · '}
                    Re:{' '}
                    <Link
                      href={`/listings/${inquiry.listing.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {inquiry.listing.title}
                    </Link>
                  </p>
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">{inquiry.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </p>
                  {!inquiry.isRead && (
                    <button
                      onClick={() => markRead(inquiry.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: data })
      if (res.ok) {
        const { url } = await res.json()
        setFormData((prev) => ({ ...prev, profilePictureUrl: url }))
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
            <div className="flex items-center gap-4 mb-4">
              {profile.profilePictureUrl ? (
                <Image
                  src={profile.profilePictureUrl}
                  alt={profile.user.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-16 h-16 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-xl font-medium text-primary-700">
                    {profile.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {profile.user.name}
                </h3>
                <p className="text-gray-600">{profile.user.email}</p>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.profilePictureUrl ? (
                      <Image
                        src={formData.profilePictureUrl}
                        alt="Profile picture"
                        width={64}
                        height={64}
                        className="rounded-full object-cover w-16 h-16 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-xl font-medium text-primary-700">
                          {profile?.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleProfilePictureUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      {formData.profilePictureUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, profilePictureUrl: '' }))}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
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
