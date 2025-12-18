// This file is intentionally left blank.
// The Genkit API route has been disabled to resolve build issues.
// To re-enable Genkit, you would typically import and export the handler from '@genkit-ai/next'.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Genkit API is disabled.' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ message: 'Genkit API is disabled.' }, { status: 404 });
}
