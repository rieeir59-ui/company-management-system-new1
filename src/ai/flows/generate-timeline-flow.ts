
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TaskSchema = z.object({
  taskName: z.string().describe('The name of the project task or milestone.'),
  startDate: z.string().describe('The start date of the task in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the task in YYYY-MM-DD format.'),
});

const TimelineOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of all project tasks with their start and end dates.'),
});

export type TimelineOutput = z.infer<typeof TimelineOutputSchema>;

const GenerateTimelineInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  area: z.string().describe('The area of the project in square feet.'),
});

export type GenerateTimelineInput = z.infer<typeof GenerateTimelineInputSchema>;

export async function generateTimeline(input: GenerateTimelineInput): Promise<TimelineOutput> {
  const llmResponse = await generateTimelineFlow(input);
  return llmResponse;
}

const generateTimelineFlow = ai.defineFlow(
  {
    name: 'generateTimelineFlow',
    inputSchema: GenerateTimelineInputSchema,
    outputSchema: TimelineOutputSchema,
  },
  async (input) => {

    const prompt = `
      You are a project manager for an architecture firm. Based on the project name and area, generate a realistic timeline.
      The project name is "${input.projectName}" and the area is ${input.area} sft.
      
      Create a list of tasks. The main tasks are:
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
      
      For each task, provide a reasonable start and end date in YYYY-MM-DD format. The start date should be based on the current date. Be realistic about the duration based on the project area.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-pro',
      output: {
        schema: TimelineOutputSchema,
      },
    });

    return llmResponse.output!;
  }
);
