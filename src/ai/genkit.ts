
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// @ts-ignore
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-pro',
});
