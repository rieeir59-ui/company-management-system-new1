'use server';
import 'server-only';
// This file is required for Genkit to work with Next.js.
// It catches all API requests to /api/genkit/... and routes them to the Genkit handler.
// import { defineNextJsHandler } from '@genkit-ai/next';
// import '@/ai/flows/generate-timeline-flow';

// export const { GET, POST } = defineNextJsHandler();

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Genkit API is temporarily disabled.' }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ message: 'Genkit API is temporarily disabled.' }, { status: 200 });
}
