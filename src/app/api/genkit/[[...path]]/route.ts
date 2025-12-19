import { genkit } from 'genkit';
import {googleAI} from '@genkit-ai/google-genai'
import { defineDotprompt, dotprompt } from '@genkit-ai/dotprompt';
import { z } from 'zod';
import {NextRequest} from 'next/server';
import {v1} from '@google-cloud/aiplatform';

import { handleAuth, init } from '@genkit-ai/next/plugin';

const ankitTool = new v1.PredictionServiceClient({
  apiEndpoint: "us-central1-aiplatform.googleapis.com"
});

genkit({
  plugins: [googleAI(), dotprompt()],
  logLevel: 'debug',
  enableTracing: true,
});

export const POST = async (req: NextRequest) => {
  const json = await req.json();
  return handleAuth(req, async (auth) => {
    if (!auth) {
      throw new Error('Auth required.');
    }
  });
};
