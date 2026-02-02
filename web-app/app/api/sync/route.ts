import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint allows extension to sync without full auth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const syncToken = searchParams.get('token')

  if (!syncToken) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 })
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: { syncToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  })

  if (!preferences) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return NextResponse.json({
    userId: preferences.userId,
    focusModeEnabled: preferences.focusModeEnabled,
    whitelist: JSON.parse(preferences.whitelist),
    blacklist: JSON.parse(preferences.blacklist),
    youtubeBlockedCategories: preferences.youtubeBlockedCategories ? JSON.parse(preferences.youtubeBlockedCategories) : [],
    scheduleStart: preferences.scheduleStart,
    scheduleEnd: preferences.scheduleEnd,
    lastSyncAt: preferences.lastSyncAt,
  })
}
