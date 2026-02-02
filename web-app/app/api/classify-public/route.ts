import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { classifyContent as ruleBasedClassify } from '@/lib/rule-based-classifier'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here'
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title, description, channelName, videoId, syncToken } = body

    // Verify sync token
    if (!syncToken) {
      return NextResponse.json({ error: 'Sync token required' }, { status: 401 })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { syncToken },
    })

    if (!preferences) {
      return NextResponse.json({ error: 'Invalid sync token' }, { status: 401 })
    }

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

    let result;

    // Try OpenAI if available, otherwise use rule-based
    if (openai) {
      try {
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

        result = JSON.parse(completion.choices[0].message.content || '{}')
      } catch (error) {
        console.error('OpenAI classification failed, falling back to rule-based:', error)
        result = ruleBasedClassify(title, description, channelName)
      }
    } else {
      // Use rule-based classification
      result = ruleBasedClassify(title, description, channelName)
    }

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
        classifiedBy: openai ? 'ai' : 'rules',
        expiresAt,
      },
    })

    return NextResponse.json({
      isEducational: result.isEducational,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      cached: false,
      method: openai ? 'ai' : 'rules',
    })
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json(
      { error: 'Failed to classify content' },
      { status: 500 }
    )
  }
}
