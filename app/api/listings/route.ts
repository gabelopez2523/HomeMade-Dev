import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { FoodCategory } from '@prisma/client'
import zipcodes from 'zipcodes'

const listingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().nullable(),
  listingDate: z.string().min(1),
  pickupTime: z.string().min(1),
  pickupLocation: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  category: z.nativeEnum(FoodCategory).optional(),
  servingDescription: z.string().optional().nullable(),
})

// Parse a location string into zip code(s)
// Accepts either "12345" (zip) or "City, ST" format
function resolveLocation(locationInput: string): { exactZips: string[]; primaryZip: string } | null {
  if (/^\d{5}$/.test(locationInput)) {
    return { exactZips: [locationInput], primaryZip: locationInput }
  }

  const match = locationInput.match(/^(.+?),\s*([A-Za-z]{2})$/)
  if (match) {
    const [, city, state] = match
    const results = zipcodes.lookupByName(city.trim(), state.trim().toUpperCase())
    if (results && results.length > 0) {
      return {
        exactZips: results.map((r: any) => r.zip),
        primaryZip: results[0].zip,
      }
    }
  }

  return null
}

// GET - List food listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const onlyActive = searchParams.get('onlyActive') === 'true'
    const query = searchParams.get('q')?.trim()
    const locationInput = searchParams.get('location')?.trim()
    const nearby = searchParams.get('nearby') === 'true'
    const radius = parseInt(searchParams.get('radius') || '25', 10)
    const categoryParam = searchParams.get('category')
    const suggestCategory = searchParams.get('suggestCategory') === 'true'

    // Legacy params (backward compat)
    const zipCode = searchParams.get('zipCode')
    const nearZip = searchParams.get('nearZip')
    const excludeZip = searchParams.get('excludeZip')

    const where: any = {}

    // Seller filter
    if (sellerId) {
      if (sellerId === 'current') {
        const session = await getServerSession(authOptions)
        if (session?.user) {
          const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id },
          })
          if (sellerProfile) {
            where.sellerId = sellerProfile.id
          } else {
            return NextResponse.json([])
          }
        } else {
          return NextResponse.json([])
        }
      } else {
        where.sellerId = sellerId
      }
    }

    if (onlyActive) {
      where.isActive = true
    }

    // Location resolution — new unified `location` param
    let resolvedLocation: { exactZips: string[]; primaryZip: string } | null = null

    if (locationInput) {
      resolvedLocation = resolveLocation(locationInput)
      if (!resolvedLocation) {
        // Could not parse location — return empty
        if (suggestCategory) {
          return NextResponse.json({ listings: [], suggestions: [], suggestionType: null })
        }
        return NextResponse.json([])
      }

      if (nearby) {
        // Nearby mode: find zips within radius, excluding exact location zips
        const nearbyZips = zipcodes.radius(resolvedLocation.primaryZip, radius)
        if (nearbyZips && nearbyZips.length > 0) {
          const exactSet = new Set(resolvedLocation.exactZips)
          const filteredZips = nearbyZips.filter((z) => !exactSet.has(String(z)))
          if (filteredZips.length > 0) {
            where.zipCode = { in: filteredZips }
          } else {
            if (suggestCategory) {
              return NextResponse.json({ listings: [], suggestions: [], suggestionType: null })
            }
            return NextResponse.json([])
          }
        } else {
          if (suggestCategory) {
            return NextResponse.json({ listings: [], suggestions: [], suggestionType: null })
          }
          return NextResponse.json([])
        }
      } else {
        // Exact location match
        if (resolvedLocation.exactZips.length === 1) {
          where.zipCode = resolvedLocation.exactZips[0]
        } else {
          where.zipCode = { in: resolvedLocation.exactZips }
        }
      }
    } else if (nearZip) {
      // Legacy nearby zip param
      const nearbyZips = zipcodes.radius(nearZip, radius)
      if (nearbyZips && nearbyZips.length > 0) {
        const filteredZips = excludeZip
          ? nearbyZips.filter((z) => String(z) !== excludeZip)
          : nearbyZips
        where.zipCode = { in: filteredZips }
      } else {
        return NextResponse.json([])
      }
    } else if (zipCode) {
      where.zipCode = zipCode
    }

    // Category filter
    if (categoryParam) {
      where.category = categoryParam
    }

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const listings = await prisma.foodListing.findMany({
      where,
      include: {
        seller: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Suggestion fallback: if no results and suggestCategory is requested
    if (listings.length === 0 && suggestCategory && categoryParam) {
      const suggestionWhere: any = { ...where }
      delete suggestionWhere.OR // remove text search
      suggestionWhere.category = categoryParam

      const suggestions = await prisma.foodListing.findMany({
        where: suggestionWhere,
        include: {
          seller: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
      })

      return NextResponse.json({
        listings: [],
        suggestions,
        suggestionType: 'category',
      })
    }

    if (suggestCategory) {
      return NextResponse.json({ listings, suggestions: [], suggestionType: null })
    }

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new food listing (authenticated sellers only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = listingSchema.parse(body)

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!sellerProfile) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    const listing = await prisma.foodListing.create({
      data: {
        sellerId: sellerProfile.id,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        listingDate: new Date(data.listingDate),
        pickupTime: new Date(data.pickupTime),
        pickupLocation: data.pickupLocation,
        city: data.city || sellerProfile.city,
        state: data.state || sellerProfile.state,
        zipCode: data.zipCode || sellerProfile.zipCode,
        category: data.category,
        servingDescription: data.servingDescription,
      },
      include: {
        seller: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
