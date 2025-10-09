import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateMotivationalQuote(
  timeOfDay: "morning" | "afternoon"
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `Generate a SHORT (max 15 words), funny, fake motivational quote for a startup founder.

Time of day: ${timeOfDay}
${
  timeOfDay === "morning"
    ? "Make it about starting the day, energy, or morning motivation."
    : "Make it about finishing the day, reflecting, or evening wisdom."
}

The quote should be attributed to a famous person (real or fictional) but the quote itself should be completely made up and slightly absurd/humorous while still being motivational.

Format: "Quote text" - Famous Person

Example (morning): "Coffee first, unicorns later." - Elon Musk
Example (afternoon): "The best code is written after 9 PM." - Steve Jobs

Generate ONE quote only.`,
    });

    return text.trim();
  } catch (error) {
    console.error("Error generating quote:", error);
    // Fallback quotes
    return timeOfDay === "morning"
      ? '"Ship fast, debug faster." - Mark Zuckerberg'
      : '"Sleep is for the funded." - Paul Graham';
  }
}

export async function categorizeMood(emailResponse: string): Promise<number> {
  try {
    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `You are analyzing the mood of a startup founder based on their email response.

Read their response and categorize their mood on a scale from 0 to 5:
- 0: Terrible (very negative, depressed, hopeless)
- 1: Bad (negative, frustrated, struggling)
- 2: Meh (neutral-negative, uninspired, going through the motions)
- 3: Okay (neutral-positive, stable, managing)
- 4: Good (positive, motivated, making progress)
- 5: Excellent (very positive, energized, thriving)

The response might be in Spanish or English. Analyze the sentiment, tone, and content.

Email response: "${emailResponse}"

Respond ONLY with a single number from 0 to 5. Nothing else.`,
    });

    const mood = parseInt(text.trim(), 10);

    // Validate the response
    if (isNaN(mood) || mood < 0 || mood > 5) {
      console.error("Invalid mood categorization:", text);
      return 3; // Default to "Okay" if categorization fails
    }

    return mood;
  } catch (error) {
    console.error("Error categorizing mood:", error);
    return 3; // Default to "Okay" if error occurs
  }
}
