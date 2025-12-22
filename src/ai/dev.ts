'use server';
import 'server-only';
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// This is a dummy export for the `ai` object.
// The actual Genkit configuration is now managed in `src/app/api/genkit/[[...path]]/route.ts`.
export const ai = {};

// The actual configuration is in the API route.
// This is just to satisfy any lingering imports in the app.
// It will be initialized correctly on the server by the API route handler.
if (process.env.NODE_ENV === 'development') {
  configureGenkit({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracing: true,
  });
}
