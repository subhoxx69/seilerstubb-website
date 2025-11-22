/**
 * OpenRouter AI Service for emoji suggestions
 */

export interface EmojiSuggestion {
  emoji: string;
  reasoning: string;
}

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/sherlock-think-alpha';

/**
 * Suggest the perfect emoji for a category using AI
 * @param categoryName - Name of the category (without emoji)
 * @param usedEmojis - Array of already used emojis to avoid duplicates
 * @returns Promise with suggested emoji and reasoning
 */
export async function suggestEmojiForCategory(
  categoryName: string,
  usedEmojis: string[] = []
): Promise<EmojiSuggestion> {
  try {
    const usedEmojisString = usedEmojis.length > 0 
      ? `\n\nALREADY USED EMOJIS TO AVOID: ${usedEmojis.join(', ')}`
      : '';

    const prompt = `You are a restaurant menu design expert. Suggest the perfect single emoji (just 1 emoji character) for a restaurant category.

Category: "${categoryName}"${usedEmojisString}

Requirements:
1. Return ONLY a single emoji character that best represents this category
2. The emoji must be visually distinct and memorable
3. Do NOT use any emoji that is in the "ALREADY USED EMOJIS" list above
4. Avoid food emojis if the category is more about service/drinks
5. Choose emojis that are clear on all platforms

Respond in this exact JSON format:
{
  "emoji": "🔤",
  "reasoning": "Brief explanation of why this emoji fits"
}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.emoji || typeof parsed.emoji !== 'string') {
      throw new Error('Invalid emoji in response');
    }

    return {
      emoji: parsed.emoji,
      reasoning: parsed.reasoning || 'AI suggested emoji',
    };
  } catch (error) {
    console.error('Error suggesting emoji:', error);
    throw error;
  }
}

/**
 * Batch suggest emojis for multiple categories
 */
export async function suggestEmojisForCategories(
  categories: string[],
  existingMappings: Record<string, string> = {}
): Promise<Record<string, EmojiSuggestion>> {
  const usedEmojis = Object.values(existingMappings);
  const results: Record<string, EmojiSuggestion> = {};

  for (const category of categories) {
    if (existingMappings[category]) {
      results[category] = {
        emoji: existingMappings[category],
        reasoning: 'Existing assignment',
      };
      continue;
    }

    try {
      const suggestion = await suggestEmojiForCategory(category, usedEmojis);
      results[category] = suggestion;
      usedEmojis.push(suggestion.emoji);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to suggest emoji for ${category}:`, error);
      results[category] = {
        emoji: '🍽️',
        reasoning: 'Default fallback emoji',
      };
    }
  }

  return results;
}
