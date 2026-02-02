// Rule-based content classification as fallback when OpenAI is not available

interface ClassificationResult {
  isEducational: boolean;
  category: string;
  confidence: number;
  reasoning: string;
}

// Keywords for each category
const categoryKeywords = {
  gaming: [
    'gameplay', 'gaming', 'game', 'playthrough', 'walkthrough', 'lets play',
    'fortnite', 'minecraft', 'roblox', 'valorant', 'league of legends', 'lol',
    'cod', 'warzone', 'apex', 'overwatch', 'stream', 'twitch'
  ],
  vlog: [
    'vlog', 'daily vlog', 'my day', 'day in the life', 'daily life',
    'morning routine', 'night routine', 'what i eat', 'grwm'
  ],
  comedy: [
    'funny', 'comedy', 'laugh', 'hilarious', 'joke', 'prank',
    'meme', 'sketch', 'stand up', 'humor'
  ],
  music: [
    'music video', 'official video', 'lyrics', 'song', 'album',
    'mv', 'audio', 'live performance', 'concert', 'cover'
  ],
  sports: [
    'highlights', 'game highlights', 'match', 'sports', 'football',
    'basketball', 'soccer', 'nba', 'nfl', 'goal', 'touchdown'
  ],
  reaction: [
    'reaction', 'reacts to', 'react', 'first time', 'watching',
    'responds to', 'reviews'
  ],
  tutorial: [
    'tutorial', 'how to', 'guide', 'learn', 'course', 'lesson',
    'step by step', 'beginner', 'for beginners', 'explained'
  ],
  documentary: [
    'documentary', 'history', 'explained', 'the story of',
    'what happened', 'investigation'
  ],
  tech: [
    'tech', 'technology', 'review', 'unboxing', 'specs', 'iphone',
    'android', 'laptop', 'pc', 'coding', 'programming'
  ],
  cooking: [
    'recipe', 'cooking', 'baking', 'how to cook', 'chef',
    'food', 'kitchen', 'ingredients'
  ],
  fitness: [
    'workout', 'exercise', 'fitness', 'gym', 'training',
    'bodybuilding', 'yoga', 'cardio'
  ],
  news: [
    'news', 'breaking news', 'latest', 'today', 'update',
    'announcement', 'report'
  ],
};

// Educational categories
const educationalCategories = ['tutorial', 'documentary', 'tech', 'cooking', 'fitness', 'news'];

// Entertainment categories
const entertainmentCategories = ['gaming', 'vlog', 'comedy', 'music', 'sports', 'reaction'];

export function classifyContent(
  title: string,
  description: string,
  channelName: string
): ClassificationResult {
  const text = `${title} ${description} ${channelName}`.toLowerCase();

  const categoryScores: Record<string, number> = {};

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
    categoryScores[category] = score;
  }

  // Find category with highest score
  let bestCategory = 'entertainment';
  let bestScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // If no clear match, default to entertainment
  if (bestScore === 0) {
    bestCategory = 'entertainment';
  }

  // Determine if educational
  const isEducational = educationalCategories.includes(bestCategory);

  // Calculate confidence (0.0 to 1.0)
  // Higher score = higher confidence, but cap at 0.9 for rule-based
  const confidence = Math.min(0.9, 0.5 + (bestScore * 0.1));

  const reasoning = bestScore > 0
    ? `Matched ${bestScore} keyword(s) for ${bestCategory} category`
    : 'No specific keywords matched, defaulting to entertainment';

  return {
    isEducational,
    category: bestCategory,
    confidence,
    reasoning,
  };
}
