import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — toggle sold status on a listing the current seller owns
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.foodListing.findUnique({
      where: { id: params.id },
      include: { seller: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (existing.seller.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const markSold: boolean = body.sold ?? true

    const listing = await prisma.foodListing.update({
      where: { id: params.id },
      data: { soldAt: markSold ? new Date() : null },
    })

    return NextResponse.json({ soldAt: listing.soldAt })
  } catch (error) {
    console.error('Error updating sold status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
