
import { z } from 'zod';

export const GenerateTimelineOutputSchema = z.object({
  tasks: z.array(
    z.object({
      taskName: z.string().describe('The name of the project task or phase.'),
      startDate: z.string().describe('The start date of the task in YYYY-MM-DD format.'),
      endDate: z.string().describe('The end date of the task in YYYY-MM-DD format.'),
    })
  ).describe('A list of project tasks with their start and end dates.'),
});
