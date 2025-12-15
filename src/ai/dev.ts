'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins = [];
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
}

// Correctly initialize Genkit once and export the ai object.
export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
