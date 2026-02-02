import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week' // 'day' or 'week'

  const now = new Date()
  const startDate = new Date()
  
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate.setDate(now.getDate() - 7)
  }

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      userId: session.userId,
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  const stats = {
    totalBlocked: activityLogs.filter(log => log.wasBlocked).length,
    totalAllowed: activityLogs.filter(log => !log.wasBlocked).length,
    byDomain: activityLogs.reduce((acc, log) => {
      acc[log.domain] = (acc[log.domain] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byCategory: activityLogs.reduce((acc, log) => {
      const category = log.category || 'unknown'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  const streak = await prisma.streak.findUnique({
    where: { userId: session.userId },
  })

  return NextResponse.json({
    stats,
    streak,
    logs: activityLogs.slice(0, 50), // Return last 50 logs
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { domain, blockedUrl, wasBlocked, category } = body

    const log = await prisma.activityLog.create({
      data: {
        userId: session.userId,
        domain,
        blockedUrl,
        wasBlocked,
        category,
      },
    })

    // Update streak if blocked
    if (wasBlocked) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const streak = await prisma.streak.findUnique({
        where: { userId: session.userId },
      })

      if (streak) {
        const lastActive = new Date(streak.lastActiveDate)
        lastActive.setHours(0, 0, 0, 0)

        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          // Consecutive day
          await prisma.streak.update({
            where: { userId: session.userId },
            data: {
              currentStreak: streak.currentStreak + 1,
              longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
              lastActiveDate: today,
            },
          })
        } else if (daysDiff > 1) {
          // Streak broken
          await prisma.streak.update({
            where: { userId: session.userId },
            data: {
              currentStreak: 1,
              lastActiveDate: today,
            },
          })
        }
      }
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
