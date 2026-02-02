import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        preferences: {
          create: {
            focusModeEnabled: true,
            whitelist: JSON.stringify([
              'stackoverflow.com',
              'github.com',
              'coursera.org',
              'khanacademy.org',
              'edx.org',
              'youtube.com/c/CrashCourse',
            ]),
            blacklist: JSON.stringify([
              'instagram.com',
              'tiktok.com',
              'reddit.com',
              'netflix.com',
              'twitter.com',
              'facebook.com',
            ]),
            syncToken: crypto.randomUUID(),
          },
        },
        streaks: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    // Create JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    await setAuthCookie(token)

    return NextResponse.json({
      user,
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
