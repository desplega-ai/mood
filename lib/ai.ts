import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

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
