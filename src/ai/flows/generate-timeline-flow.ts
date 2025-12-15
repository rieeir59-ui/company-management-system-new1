
'use server';

import { ai } from '@/ai/dev';
import { GenerateTimelineOutputSchema } from '@/lib/schemas/timeline';
import { z } from 'zod';

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

const generateTimelineFlow = ai.defineFlow(
  {
    name: 'generateTimelineFlow',
    inputSchema: GenerateTimelineInputSchema,
    outputSchema: GenerateTimelineOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-001',
      prompt: `
        You are a project manager for an architectural firm.
        Generate a realistic timeline for the given project.
        The timeline should include key phases like Site Survey, Design, Tendering, and Construction.

        Project Name: ${input.projectName}
        Area: ${input.area} sft
      `,
      output: {
        schema: GenerateTimelineOutputSchema,
      },
    });

    if (!output) {
      throw new Error('Failed to generate a structured timeline from the AI model.');
    }
    return output;
  }
);
