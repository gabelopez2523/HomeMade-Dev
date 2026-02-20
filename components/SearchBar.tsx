'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LocationSuggestion } from '@/app/api/location-suggestions/route'

interface SearchBarProps {
  onSearch: (params: { location: string; query: string }) => void
  detectedLocation?: string
  detecting?: boolean
  initialLocation?: string
  initialQuery?: string
}

export function SearchBar({
  onSearch,
  detectedLocation = '',
  detecting = false,
  initialLocation = '',
  initialQuery = '',
}: SearchBarProps) {
  const [location, setLocation] = useState('')
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync initial values when they arrive asynchronously
  useEffect(() => {
    if (initialLocation && !location) setLocation(initialLocation)
  }, [initialLocation])

  useEffect(() => {
    if (initialQuery && !query) setQuery(initialQuery)
  }, [initialQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced fetch of suggestions while user types
  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/location-suggestions?q=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data: LocationSuggestion[] = await res.json()
          setSuggestions(data)
        }
      } catch {
        // Silently ignore
      } finally {
        setLoadingSuggestions(false)
      }
    }, 250)
  }, [])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    setActiveIndex(-1)
    fetchSuggestions(value)
    setShowDropdown(true)
  }

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.label)
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  const handleSelectNearby = () => {
    setLocation(detectedLocation)
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  // Show "In Your Area" suggestion only when field is empty and location is known
  const showNearby = !location && !detecting && !!detectedLocation

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = (showNearby ? 1 : 0) + suggestions.length
    if (!showDropdown || totalItems === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      if (showNearby && activeIndex === 0) {
        handleSelectNearby()
      } else {
        const idx = showNearby ? activeIndex - 1 : activeIndex
        if (suggestions[idx]) handleSelectSuggestion(suggestions[idx])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowDropdown(false)
    onSearch({ location: location.trim(), query: query.trim() })
  }

  const showDropdownContent =
    showDropdown && (showNearby || suggestions.length > 0 || loadingSuggestions)

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        {/* Where section */}
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          <div className="px-6 py-3 border-r border-gray-200">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
              Where
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Zip code or City, State"
              autoComplete="off"
              className="w-full text-sm text-black placeholder-gray-400 bg-transparent border-none outline-none p-0"
            />
          </div>

          {/* Dropdown */}
          {showDropdownContent && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">

              {/* "In Your Area" — shown when field is empty */}
              {showNearby && (
                <button
                  type="button"
                  onClick={handleSelectNearby}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                    activeIndex === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">In Your Area</p>
                    <p className="text-sm text-gray-500">Explore foods near you</p>
                  </div>
                </button>
              )}

              {/* Loading */}
              {loadingSuggestions && suggestions.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-400">Searching...</div>
              )}

              {/* City / zip suggestions */}
              {suggestions.map((s, i) => {
                const itemIndex = showNearby ? i + 1 : i
                return (
                  <button
                    key={`${s.city}-${s.state}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className={`w-full flex items-center gap-4 px-5 py-3 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                      activeIndex === itemIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.city}</p>
                      <p className="text-sm text-gray-500">{s.state}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* What section */}
        <div className="flex-1 px-6 py-3 min-w-0">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
            What
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tamales, cookies, BBQ..."
            className="w-full text-sm text-black placeholder-gray-400 bg-transparent border-none outline-none p-0"
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="flex-shrink-0 m-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-3 transition-colors"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
