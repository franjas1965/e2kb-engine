import { NextResponse } from 'next/server';

export async function GET() {
  const doclingUrl = process.env.DOCLING_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${doclingUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ available: true, ...data });
    }
    
    return NextResponse.json({ available: false }, { status: 503 });
  } catch {
    return NextResponse.json({ available: false }, { status: 503 });
  }
}
