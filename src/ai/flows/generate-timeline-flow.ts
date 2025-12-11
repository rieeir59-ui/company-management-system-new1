
'use server';

import { ai } from '@/ai/genkit';
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
  const llmResponse = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `
      You are a project manager for an architectural firm.
      Generate a realistic timeline for the given project.
      The timeline should include key phases like Site Survey, Design, Tendering, and Construction.
      The output must be a valid JSON object that conforms to the provided schema. Do not add any extra text or markdown formatting around the JSON.

      Project Name: ${input.projectName}
      Area: ${input.area} sft

      Here is the required JSON schema:
      ${JSON.stringify(GenerateTimelineOutputSchema.jsonSchema)}
    `,
    output: {
      format: 'json',
    },
    config: {
      temperature: 0.3,
    },
  });

  const structuredResponse = llmResponse.output();

  if (!structuredResponse) {
    throw new Error('Failed to generate a structured timeline from the AI model.');
  }

  // Validate the response against the Zod schema
  const parsed = GenerateTimelineOutputSchema.safeParse(structuredResponse);

  if (!parsed.success) {
    console.error('AI response validation failed:', parsed.error);
    throw new Error('The AI returned data in an unexpected format.');
  }

  return parsed.data;
}
