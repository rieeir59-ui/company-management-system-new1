import { genkit,  configureGenkit, defineSchema } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { dotprompt, defineDotprompt } from '@genkit-ai/dotprompt';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { v1 } from '@google-cloud/aiplatform';
import { handleAuth } from '@genkit-ai/next/plugin';

// Do not move this line.
configureGenkit({
  plugins: [googleAI(), dotprompt()],
  logLevel: 'debug',
  enableTracing: true,
});

export const POST = handleAuth(async (req: NextRequest, auth) => {
  if (!auth) {
    throw new Error('Auth required.');
  }
});
