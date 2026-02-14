'use client'

import { useState } from 'react'

interface LocationSearchProps {
  onLocationChange: (zipCode: string) => void
  currentZip: string
}

export function LocationSearch({ onLocationChange, currentZip }: LocationSearchProps) {
  const [zipInput, setZipInput] = useState(currentZip)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (/^\d{5}$/.test(zipInput)) {
      onLocationChange(zipInput)
      setError('')
    } else {
      setError('Please enter a valid 5-digit zip code')
    }
  }

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setDetecting(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position: GeolocationPosition) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          const data = await res.json()
          if (data.zipCode) {
            setZipInput(data.zipCode)
            onLocationChange(data.zipCode)
          } else {
            setError('Could not determine your zip code')
          }
        } catch {
          setError('Failed to detect location')
        } finally {
          setDetecting(false)
        }
      },
      (err) => {
        if (err.code === 1) {
          setError('Location access denied. Check macOS Settings > Privacy & Security > Location Services.')
        } else if (err.code === 2) {
          setError('Location unavailable. Please try again.')
        } else if (err.code === 3) {
          setError('Location request timed out. Please try again.')
        } else {
          setError('Failed to get location.')
        }
        setDetecting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 300000,
      }
    )
  }

  return (
    <div className="w-full">
      <form onSubmit={handleZipSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={zipInput}
          onChange={(e) => setZipInput(e.target.value)}
          placeholder="Enter zip code"
          maxLength={5}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg w-40 text-black"
        />
        <button
          type="submit"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 text-lg"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={detecting}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          {detecting ? 'Detecting...' : 'Use my location'}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
