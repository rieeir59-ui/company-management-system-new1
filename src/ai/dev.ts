'use server';
import 'server-only';

// import { genkit } from 'genkit';
// import { googleAI } from '@genkit-ai/google-genai';

const plugins: any[] = [];
// if (process.env.GEMINI_API_KEY) {
//   plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
// }

// Correctly initialize Genkit once and export the ai object.
// export const ai = genkit({
//   plugins,
//   logLevel: 'debug',
//   enableTracingAndMetrics: true,
// });

// Dummy export to avoid breaking imports
export const ai = {
    definePrompt: (config: any) => async (input: any) => ({ output: null }),
    defineFlow: (config: any, fn: any) => fn,
};
