import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must contain uppercase, lowercase, and a number or symbol'),
  phone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
})

// Precomputed dummy hash so timing is consistent whether or not a user exists
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'

export async function POST(request: NextRequest) {
  // CSRF: reject requests whose origin doesn't match the host
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit by IP: 5 registrations per 10 minutes
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (!rateLimit(`register:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { name, email, password, phone, contactEmail, city, state, zipCode } =
      registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      // Run a dummy compare so timing is indistinguishable from a real miss
      await bcrypt.compare(password, DUMMY_HASH)
      return NextResponse.json(
        { error: 'Registration failed. Please check your details and try again.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        sellerProfile: {
          create: {
            phone: phone || null,
            contactEmail: contactEmail || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
