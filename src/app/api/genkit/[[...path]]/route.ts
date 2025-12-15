// This file is required for Genkit to work with Next.js.
// It catches all API requests to /api/genkit/... and routes them to the Genkit handler.
import { defineNextJsHandler } from '@genkit-ai/next';
import '@/ai/flows/generate-timeline-flow';

export const { GET, POST } = defineNextJsHandler();
