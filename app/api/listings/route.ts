import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
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
})

// GET - List food listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const onlyActive = searchParams.get('onlyActive') === 'true'
    const zipCode = searchParams.get('zipCode')
    const query = searchParams.get('q')?.trim()
    const nearZip = searchParams.get('nearZip')
    const radius = parseInt(searchParams.get('radius') || '25', 10)

    const where: any = {}

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

    if (nearZip) {
      // Find all zip codes within the radius
      const nearbyZips = zipcodes.radius(nearZip, radius)
      if (nearbyZips && nearbyZips.length > 0) {
        // Exclude the exact zip code so it doesn't overlap with the main search
        const excludeZip = searchParams.get('excludeZip')
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
