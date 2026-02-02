import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
  })

  if (!preferences) {
    return NextResponse.json({ error: 'Preferences not found' }, { status: 404 })
  }

  // Parse JSON strings back to arrays for response
  return NextResponse.json({
    ...preferences,
    whitelist: JSON.parse(preferences.whitelist),
    blacklist: JSON.parse(preferences.blacklist),
    youtubeBlockedCategories: preferences.youtubeBlockedCategories ? JSON.parse(preferences.youtubeBlockedCategories) : [],
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { focusModeEnabled, whitelist, blacklist, youtubeBlockedCategories, scheduleStart, scheduleEnd } = body

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.userId },
      update: {
        focusModeEnabled,
        whitelist: Array.isArray(whitelist) ? JSON.stringify(whitelist) : whitelist,
        blacklist: Array.isArray(blacklist) ? JSON.stringify(blacklist) : blacklist,
        youtubeBlockedCategories: Array.isArray(youtubeBlockedCategories) ? JSON.stringify(youtubeBlockedCategories) : youtubeBlockedCategories,
        scheduleStart,
        scheduleEnd,
        lastSyncAt: new Date(),
      },
      create: {
        userId: session.userId,
        focusModeEnabled: focusModeEnabled ?? true,
        whitelist: Array.isArray(whitelist) ? JSON.stringify(whitelist) : '[]',
        blacklist: Array.isArray(blacklist) ? JSON.stringify(blacklist) : '[]',
        youtubeBlockedCategories: Array.isArray(youtubeBlockedCategories) ? JSON.stringify(youtubeBlockedCategories) : '[]',
        scheduleStart,
        scheduleEnd,
        syncToken: crypto.randomUUID(),
      },
    })

    // Parse JSON strings back to arrays for response
    return NextResponse.json({
      ...preferences,
      whitelist: JSON.parse(preferences.whitelist),
      blacklist: JSON.parse(preferences.blacklist),
      youtubeBlockedCategories: preferences.youtubeBlockedCategories ? JSON.parse(preferences.youtubeBlockedCategories) : [],
    })
  } catch (error) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
