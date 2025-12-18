
'use server';

import { z } from 'zod';
// import { ai } from '@/ai/dev';
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
  // Return a dummy response since Genkit is disabled
  return {
    tasks: [
      { taskName: 'Site Survey', startDate: '2024-01-01', endDate: '2024-01-05' },
      { taskName: 'Design', startDate: '2024-01-06', endDate: '2024-01-20' },
      { taskName: 'Tendering', startDate: '2024-01-21', endDate: '2024-02-10' },
      { taskName: 'Construction', startDate: '2024-02-11', endDate: '2024-05-31' },
    ]
  };
  // return generateTimelineFlow(input);
}

// const prompt = ai.definePrompt(
//   {
//     name: 'generateTimelinePrompt',
//     input: { schema: GenerateTimelineInputSchema },
//     output: { schema: GenerateTimelineOutputSchema },
//     prompt: `
//         You are a project manager for an architectural firm.
//         Generate a realistic timeline for the given project.
//         The timeline should include key phases like Site Survey, Design, Tendering, and Construction.

//         Project Name: {{{projectName}}}
//         Area: {{{area}}} sft
//       `,
//   }
// );


// const generateTimelineFlow = ai.defineFlow(
//   {
//     name: 'generateTimelineFlow',
//     inputSchema: GenerateTimelineInputSchema,
//     outputSchema: GenerateTimelineOutputSchema,
//   },
//   async (input) => {
//     const { output } = await prompt(input);
//     if (!output) {
//       throw new Error('Failed to generate a structured timeline from the AI model.');
//     }
//     return output;
//   }
// );
