'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-primary-600"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault()
                  window.location.href = '/'
                }
              }}
            >
              HomeMade
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-gray-500">Loading...</div>
            ) : session ? (
              <>
                <Link
                  href="/seller/dashboard"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <span className="text-gray-700 px-3 py-2 text-sm">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Seller Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Sell Food
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
