'use server';

/**
 * @fileOverview A personalized daily challenge generator AI agent.
 * 
 * - generateDailyChallenge - A function that generates a personalized daily challenge.
 * - DailyChallengeInput - The input type for the generateDailyChallenge function.
 * - DailyChallengeOutput - The return type for the generateDailyChallenge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyChallengeInputSchema = z.object({
  userPlayHistory: z
    .string()
    .describe("The user's past game play history, including games played, scores, and frequency."),
});
export type DailyChallengeInput = z.infer<typeof DailyChallengeInputSchema>;

const DailyChallengeOutputSchema = z.object({
  challenge: z.string().describe('A personalized daily challenge for the user.'),
  suggestedGame: z.string().describe('A suggested game to play for the challenge.'),
});
export type DailyChallengeOutput = z.infer<typeof DailyChallengeOutputSchema>;

export async function generateDailyChallenge(input: DailyChallengeInput): Promise<DailyChallengeOutput> {
  return generateDailyChallengeFlow(input);
}

const suggestGameTool = ai.defineTool({
  name: 'suggestGame',
  description: 'Suggests a game based on the challenge.',
  inputSchema: z.object({
    challenge: z.string().describe('The generated daily challenge.'),
    userPlayHistory: z.string().describe("The user's past game play history, including games played, scores, and frequency."),
  }),
  outputSchema: z.string().describe('The name of the suggested game.'),
}, async (input) => {
  // Basic logic to suggest a game based on play history; can be expanded.
  const gamesPlayed = input.userPlayHistory.split(',').map(game => game.trim());
  if (gamesPlayed.length > 0) {
    // Suggest the most recently played game
    return gamesPlayed[gamesPlayed.length - 1];
  } else {
    return 'Bubble Popper'; // Default game if no history
  }
});

const prompt = ai.definePrompt({
  name: 'generateDailyChallengePrompt',
  input: {schema: DailyChallengeInputSchema},
  output: {schema: DailyChallengeOutputSchema},
  tools: [suggestGameTool],
  prompt: `You are an AI challenge generator that creates personalized daily challenges for users based on their past game play history.

  User Play History: {{{userPlayHistory}}}

  Generate a unique and engaging daily challenge that encourages the user to play. Suggest a game from the user's play history that aligns well with the challenge using the suggestGame tool, passing in both the challenge and user history to the tool.

  Output the challenge and suggested game in a structured format.
  `,
});

const generateDailyChallengeFlow = ai.defineFlow(
  {
    name: 'generateDailyChallengeFlow',
    inputSchema: DailyChallengeInputSchema,
    outputSchema: DailyChallengeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
