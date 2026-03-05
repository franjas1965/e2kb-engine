import { NextRequest, NextResponse } from 'next/server';
import { convertEPUB } from '@/lib/epub-engine';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Configure route segment for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const outputFormat = formData.get('outputFormat') as string || 'multi';
    const extractImages = formData.get('extractImages') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 });
    }

    if (!file.name.toLowerCase().endsWith('.epub')) {
      return NextResponse.json({ error: 'Only EPUB files are supported' }, { status: 400 });
    }

    const tempDir = path.join(os.tmpdir(), `e2kb-${Date.now()}`);
    const inputPath = path.join(tempDir, file.name);
    const outputDir = path.join(tempDir, 'output');

    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    const result = await convertEPUB(inputPath, outputDir, {
      outputFormat: outputFormat as 'single' | 'multi',
      extractImages,
      convertWikiLinks: true
    });

    const outputBuffer = fs.readFileSync(result.outputPath);

    fs.rmSync(tempDir, { recursive: true, force: true });

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="e2kb-${file.name.replace('.epub', '')}.zip"`
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
