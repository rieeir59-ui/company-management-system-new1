'use server';
/**
 * @fileOverview A Genkit flow to generate a project timeline for an architectural project.
 *
 * - generateTimeline - A function that creates a timeline based on project name and area.
 * - GenerateTimelineInput - The input type for the generateTimeline function.
 * - GenerateTimelineOutput - The return type for the generateTimeline function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format } from 'date-fns';

const GenerateTimelineInputSchema = z.object({
  projectName: z.string().describe('The name of the architectural project.'),
  area: z.string().describe('The total area of the project in square feet (sft).'),
});
export type GenerateTimelineInput = z.infer<typeof GenerateTimelineInputSchema>;

const TaskSchema = z.object({
    taskName: z.string().describe('The specific name of the task. This must exactly match one of the tasks from the provided list.'),
    startDate: z.string().describe("The calculated start date for the task in 'yyyy-MM-dd' format."),
    endDate: z.string().describe("The calculated end date for the task in 'yyyy-MM-dd' format."),
});

const GenerateTimelineOutputSchema = z.object({
  tasks: z.array(TaskSchema),
});
export type GenerateTimelineOutput = z.infer<typeof GenerateTimelineOutputSchema>;


export async function generateTimeline(input: GenerateTimelineInput): Promise<GenerateTimelineOutput> {
  return generateTimelineFlow(input);
}

const allTasks = [
  'Site Survey', 'Contact', 'Head Count / Requirment', 'Proposal / Design Development', "3D's", 
  'Tender Package Architectural', 'Tender Package MEP', 'BOQ', 'Tender Status', 'Comparative', 
  'Working Drawings', 'Site Visit', 'Final Bill', 'Project Closure'
];

const prompt = ai.definePrompt({
  name: 'generateTimelinePrompt',
  input: { schema: GenerateTimelineInputSchema },
  output: { schema: GenerateTimelineOutputSchema },
  prompt: `You are an expert project manager for an architectural firm. Your task is to generate a realistic project timeline based on a project's name and area.

You will be given the Project Name and its Area in square feet.

Today's date is: ${format(new Date(), 'yyyy-MM-dd')}. All dates you generate must be in 'yyyy-MM-dd' format.

Based on the project details, create a schedule for the following tasks. You MUST provide a start and end date for EACH task in this list:
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

The duration of each task should be realistic based on the project's area. Larger projects will take longer. Be logical. For example, 'Site Survey' must happen before 'Proposal / Design Development'. 'Tender Status' must come after the tender packages are created.

Project Name: {{{projectName}}}
Area: {{{area}}}
`,
});

const generateTimelineFlow = ai.defineFlow(
  {
    name: 'generateTimelineFlow',
    inputSchema: GenerateTimelineInputSchema,
    outputSchema: GenerateTimelineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate timeline');
    }
    // Ensure all tasks are present in the output
    const outputTasks = output.tasks.map(t => t.taskName);
    const missingTasks = allTasks.filter(t => !outputTasks.includes(t));
    if(missingTasks.length > 0) {
      console.warn(`AI did not generate all tasks. Missing: ${missingTasks.join(', ')}`);
    }
    return output;
  }
);
