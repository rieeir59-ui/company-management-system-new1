
'use server';
/**
 * @fileOverview Generates a project timeline.
 *
 * - generateTimeline - A function that creates a timeline based on project name and area.
 * - GenerateTimelineInput - The input type for the generateTimeline function.
 * [>..] - GenerateTimelineOutput - The return type for the generateTimeline function.
 */

import { generate } from 'genkit/ai';
import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import {ai} from '@/ai/genkit';

export const GenerateTimelineInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  area: z.string().describe('The area of the project in square feet.'),
});
export type GenerateTimelineInput = z.infer<typeof GenerateTimelineInputSchema>;

export const GenerateTimelineOutputSchema = z.object({
  tasks: z.array(
    z.object({
      taskName: z.string().describe('The name of the project task or phase.'),
      startDate: z.string().describe('The start date of the task in YYYY-MM-DD format.'),
      endDate: z.string().describe('The end date of the task in YYYY-MM-DD format.'),
    })
  ).describe('A list of project tasks with their start and end dates.'),
});
export type GenerateTimelineOutput = z.infer<typeof GenerateTimelineOutputSchema>;


export async function generateTimeline(
  input: GenerateTimelineInput
): Promise<GenerateTimelineOutput> {
  const { output } = await generate({
    model: 'googleai/gemini-pro',
    prompt: `
      You are a project management assistant for an architectural firm.
      Based on the project name and area, generate a realistic timeline of key phases.
      Today's date is ${new Date().toISOString().split('T')[0]}.

      Project Name: ${input.projectName}
      Area: ${input.area} sft

      Provide the timeline for the following tasks:
      - Site Survey
      - Contact
      - Head Count / Requirment
      - Proposal / Design Development
      - 3D's
      - Tender Package Architectural
      - Tender Package MEP
      - BOQ
      - Tender Status
      - Comparative
      - Working Drawings
      - Site Visit
      - Final Bill
      - Project Closure

      Your response MUST be in a valid JSON format that adheres to the following Zod schema:
      ${JSON.stringify(GenerateTimelineOutputSchema.shape)}
    `,
    output: {
      format: 'json',
    },
  });

  if (!output) {
    throw new Error('Failed to generate timeline. No output received from the model.');
  }
  
  const parsedOutput = GenerateTimelineOutputSchema.safeParse(output);

  if (!parsedOutput.success) {
      console.error('AI output validation failed:', parsedOutput.error);
      throw new Error('The AI returned data in an unexpected format.');
  }

  return parsedOutput.data;
}
