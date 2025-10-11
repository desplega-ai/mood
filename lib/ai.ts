import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateMotivationalQuote(): Promise<string> {
  try {
    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `Generate a SHORT (max 15 words), funny, fake motivational quote for a startup founder.

Make it about startup life, growth, challenges, or entrepreneurship in general.

The quote should be attributed to a famous person (real or fictional) but the quote itself should be completely made up and slightly absurd/humorous while still being motivational.

Format: "Quote text" - Famous Person

Examples:
- "Ship fast, iterate faster, sleep never." - Elon Musk
- "The best pivot is the one you didn't plan." - Steve Jobs
- "Burn rate is just a number." - Warren Buffett

Generate ONE quote only.`,
    });

    return text.trim();
  } catch (error) {
    console.error("Error generating quote:", error);
    // Fallback quote
    return '"Ship fast, debug faster." - Mark Zuckerberg';
  }
}

export async function categorizeDualMood(
  emailResponse: string
): Promise<{ yesterday: number; today: number }> {
  try {
    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `You are analyzing the mood of a startup founder based on their email response.

They were asked TWO questions:
1. How was yesterday?
2. How do you feel about today?

Categorize BOTH moods on a scale from 0 to 5:
- 0: Terrible (very negative, depressed, hopeless)
- 1: Bad (negative, frustrated, struggling)
- 2: Meh (neutral-negative, uninspired, going through the motions)
- 3: Okay (neutral-positive, stable, managing)
- 4: Good (positive, motivated, making progress)
- 5: Excellent (very positive, energized, thriving)

The response might be in Spanish or English. Analyze the sentiment, tone, and content for BOTH time periods.

Email response: "${emailResponse}"

Respond with EXACTLY TWO numbers separated by a comma. First number is for yesterday, second is for today.
Example: 3,4
Nothing else.`,
    });

    const parts = text.trim().split(",");
    const yesterday = parseInt(parts[0]?.trim() || "3", 10);
    const today = parseInt(parts[1]?.trim() || "3", 10);

    // Validate the response
    const isValidMood = (m: number) => !isNaN(m) && m >= 0 && m <= 5;

    return {
      yesterday: isValidMood(yesterday) ? yesterday : 3,
      today: isValidMood(today) ? today : 3,
    };
  } catch (error) {
    console.error("Error categorizing mood:", error);
    return { yesterday: 3, today: 3 }; // Default to "Okay" if error occurs
  }
}
