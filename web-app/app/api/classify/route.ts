import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, title, description, channelName, videoId } = body

    // Check cache first
    const cached = await prisma.contentClassification.findUnique({
      where: { url },
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        isEducational: cached.isEducational,
        category: cached.category,
        confidence: cached.confidence,
        cached: true,
      })
    }

    // Use OpenAI to classify
    const prompt = `Analyze this content and determine if it's educational or entertainment, and classify its category.

Title: ${title}
Channel: ${channelName || 'Unknown'}
Description: ${description || 'None'}
URL: ${url}

Educational content includes:
- Tutorials, how-to guides, lectures
- Science, technology, educational documentaries
- Academic courses, skill development
- Professional development, career advice

Entertainment content includes:
- Gaming (non-tutorial), vlogs, comedy
- Entertainment shows, reaction videos
- Social media content, memes
- Sports highlights, celebrity news

Categories to classify into (pick the most specific):
- "gaming" - Video games, gameplay, gaming news
- "tutorial" - How-to guides, educational content
- "vlog" - Personal vlogs, daily life videos
- "comedy" - Funny videos, sketches, stand-up
- "music" - Music videos, concerts, songs
- "sports" - Sports highlights, matches, analysis
- "news" - News, current events
- "documentary" - Educational documentaries
- "cooking" - Cooking shows, recipes
- "fitness" - Workout videos, fitness tips
- "tech" - Technology reviews, tech news
- "reaction" - Reaction videos
- "entertainment" - General entertainment
- "educational" - General educational content

Respond with ONLY a JSON object:
{
  "isEducational": true/false,
  "category": "one of the categories above",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content classifier that determines if content is educational or entertainment-focused.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // Cache the result for 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.contentClassification.upsert({
      where: { url },
      update: {
        isEducational: result.isEducational,
        category: result.category,
        confidence: result.confidence,
        expiresAt,
      },
      create: {
        url,
        videoId,
        title,
        channelName,
        isEducational: result.isEducational,
        category: result.category,
        confidence: result.confidence,
        classifiedBy: 'ai',
        expiresAt,
      },
    })

    return NextResponse.json({
      isEducational: result.isEducational,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      cached: false,
    })
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json(
      { error: 'Failed to classify content' },
      { status: 500 }
    )
  }
}
