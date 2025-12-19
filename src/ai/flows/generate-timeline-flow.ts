
'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { GenerateTimelineOutputSchema } from '@/lib/schemas/timeline';

export const GenerateTimelineInputSchema = z.object({
  projectName: z.string(),
  area: z.string(),
});

export type GenerateTimelineInput = z.infer<typeof GenerateTimelineInputSchema>;
export type GenerateTimelineOutput = z.infer<
  typeof GenerateTimelineOutputSchema
>;

export async function generateTimeline(
  input: GenerateTimelineInput
): Promise<GenerateTimelineOutput> {
  return generateTimelineFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'generateTimelinePrompt',
    input: { schema: GenerateTimelineInputSchema },
    output: { schema: GenerateTimelineOutputSchema },
    prompt: `
        You are a project manager for an architectural firm.
        Generate a realistic timeline for the given project based on its area in square feet.
        The timeline should include key phases like Site Survey, Design, Tendering, and Construction.
        The duration of each phase should be proportional to the project's area.

        Project Name: {{{projectName}}}
        Area: {{{area}}} sft
      `,
  }
);


const generateTimelineFlow = ai.defineFlow(
  {
    name: 'generateTimelineFlow',
    inputSchema: GenerateTimelineInputSchema,
    outputSchema: GenerateTimelineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate a structured timeline from the AI model.');
    }
    return output;
  }
);
