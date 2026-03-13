import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInquiryNotification } from '@/lib/email'
import { z } from 'zod'

const inquirySchema = z.object({
  listingId: z.string().min(1),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  message: z.string().min(1).max(2000),
})

// POST — anyone can submit an inquiry (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = inquirySchema.parse(body)

    const listing = await prisma.foodListing.findUnique({
      where: { id: data.listingId },
      include: {
        seller: {
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: data.listingId,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone || null,
        message: data.message,
      },
    })

    // Send email notification to seller (non-blocking — don't fail the request if email fails)
    sendInquiryNotification({
      sellerEmail: listing.seller.user.email,
      sellerName: listing.seller.user.name,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      buyerPhone: data.buyerPhone,
      listingTitle: listing.title,
      message: data.message,
      listingId: listing.id,
    }).catch((err) => console.error('Failed to send inquiry email:', err))

    return NextResponse.json(inquiry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating inquiry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — seller fetches all inquiries for their listings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!sellerProfile) {
      return NextResponse.json([])
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        listing: { sellerId: sellerProfile.id },
      },
      include: {
        listing: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
