import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';
import * as crypto from 'crypto';
import axios from 'axios';
import FormDataNode from 'form-data';
import { sendConversionCompleteEmail, sendConversionErrorEmail } from '@/lib/email';
import { setJob, getJob, JobData } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large documents

interface DoclingResponse {
  success: boolean;
  markdown?: string;
  title?: string;
  word_count?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const doclingUrl = process.env.DOCLING_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const outputFormat = formData.get('outputFormat') as string || 'single';
    const maxWords = parseInt(formData.get('maxWords') as string || '400000', 10);
    const maxFiles = parseInt(formData.get('maxFiles') as string || '50', 10);
    const async = formData.get('async') === 'true';
    const email = formData.get('email') as string | null;
    const mode = formData.get('mode') as string || 'basic'; // 'basic' or 'premium'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // For async mode, start background processing and return job ID immediately
    if (async) {
      const jobId = crypto.randomUUID();
      const fileName = file.name;
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      await setJob(jobId, {
        status: 'processing',
        progress: 'Starting conversion...',
        email: email || undefined,
        createdAt: Date.now()
      });

      // Start background processing (don't await)
      processDocumentAsync(jobId, fileBuffer, fileName, outputFormat, maxWords, maxFiles, doclingUrl, email || undefined, mode);

      const message = email 
        ? `Conversión iniciada. Recibirás un email en ${email} cuando esté lista.`
        : 'Conversion started. Poll /api/convert-docling/status?jobId=' + jobId + ' for progress.';

      return NextResponse.json({ 
        jobId, 
        status: 'processing',
        message,
        emailNotification: !!email
      });
    }

    // Synchronous mode (original behavior with extended timeout)
    return await processDocumentSync(file, outputFormat, maxWords, maxFiles, doclingUrl, mode);

  } catch (error) {
    console.error('Docling conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}

async function processDocumentAsync(
  jobId: string,
  fileBuffer: Buffer,
  fileName: string,
  outputFormat: string,
  maxWords: number,
  maxFiles: number,
  doclingUrl: string,
  email?: string,
  mode: string = 'basic'
) {
  try {
    const currentJob = await getJob(jobId);
    await setJob(jobId, { ...currentJob!, progress: `Sending to Docling service (${mode} mode)...` });

    // Use axios with form-data for reliable timeout control
    const formData = new FormDataNode();
    formData.append('file', fileBuffer, { filename: fileName });
    formData.append('mode', mode);

    const axiosResponse = await axios.post(`${doclingUrl}/convert`, formData, {
      headers: formData.getHeaders(),
      timeout: 30 * 60 * 1000, // 30 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (axiosResponse.status !== 200) {
      const job = await getJob(jobId);
      await setJob(jobId, { ...job!, status: 'error', error: `Docling conversion failed: ${axiosResponse.statusText}` });
      return;
    }

    const jobAfterConvert = await getJob(jobId);
    await setJob(jobId, { ...jobAfterConvert!, progress: 'Processing markdown output...' });

    const result: DoclingResponse = axiosResponse.data;

    if (!result.success || !result.markdown) {
      const job = await getJob(jobId);
      await setJob(jobId, { ...job!, status: 'error', error: result.error || 'Conversion failed' });
      return;
    }

    // Create temp directory for output
    const tempDir = path.join(os.tmpdir(), `e2kb-docling-${jobId}`);
    const outputDir = path.join(tempDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });

    const title = result.title || fileName.substring(0, fileName.lastIndexOf('.'));
    const markdown = result.markdown;

    const jobBeforeFiles = await getJob(jobId);
    await setJob(jobId, { ...jobBeforeFiles!, progress: 'Creating output files...' });

    if (outputFormat === 'single') {
      const filename = `${sanitizeFilename(title)}.md`;
      fs.writeFileSync(path.join(outputDir, filename), markdown, 'utf-8');
    } else if (outputFormat === 'optimized') {
      const chapters = splitByHeaders(markdown, title);
      const merged = mergeChapters(chapters, maxWords, maxFiles, title);
      fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${fileName}\n`, 'utf-8');
      merged.forEach((chapter, index) => {
        const filename = `${String(index + 1).padStart(2, '0')}_${sanitizeFilename(chapter.title).substring(0, 100)}.md`;
        fs.writeFileSync(path.join(outputDir, filename), chapter.content, 'utf-8');
      });
    } else {
      const chapters = splitByHeaders(markdown, title);
      fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${fileName}\n`, 'utf-8');
      chapters.forEach((chapter, index) => {
        const filename = `${String(index + 1).padStart(3, '0')}_${sanitizeFilename(chapter.title).substring(0, 50)}.md`;
        fs.writeFileSync(path.join(outputDir, filename), chapter.content, 'utf-8');
      });
    }

    const jobBeforeZip = await getJob(jobId);
    await setJob(jobId, { ...jobBeforeZip!, progress: 'Creating ZIP archive...' });

    // Create ZIP archive
    const zipPath = path.join(tempDir, 'e2kb-output.zip');
    await createZip(outputDir, zipPath);

    const outputFilename = `e2kb-${fileName.substring(0, fileName.lastIndexOf('.'))}.zip`;

    const jobBeforeComplete = await getJob(jobId);
    await setJob(jobId, {
      status: 'completed',
      zipPath,
      filename: outputFilename,
      email,
      createdAt: jobBeforeComplete!.createdAt
    });

    console.log(`Job ${jobId} completed successfully`);

    // Send email notification if email was provided
    if (email) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/api/convert-docling/status?jobId=${jobId}`;
      await sendConversionCompleteEmail(email, fileName, downloadUrl);
    }

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
    
    const jobOnError = await getJob(jobId);
    await setJob(jobId, {
      ...jobOnError!,
      status: 'error',
      error: errorMessage
    });

    // Send error email if email was provided
    if (email) {
      await sendConversionErrorEmail(email, fileName, errorMessage);
    }
  }
}

async function processDocumentSync(
  file: File,
  outputFormat: string,
  maxWords: number,
  maxFiles: number,
  doclingUrl: string,
  mode: string = 'basic'
): Promise<NextResponse> {
  // Forward file to Docling service with extended timeout for large PDFs
  const doclingFormData = new FormData();
  doclingFormData.append('file', file);
  doclingFormData.append('mode', mode);

  // Create AbortController with 10 minute timeout for large document processing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes

  let doclingResponse: Response;
  try {
    doclingResponse = await fetch(`${doclingUrl}/convert`, {
      method: 'POST',
      body: doclingFormData,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!doclingResponse.ok) {
    const error = await doclingResponse.text();
    return NextResponse.json({ error: `Docling conversion failed: ${error}` }, { status: 500 });
  }

  const result: DoclingResponse = await doclingResponse.json();

  if (!result.success || !result.markdown) {
    return NextResponse.json({ error: result.error || 'Conversion failed' }, { status: 500 });
  }

  // Create temp directory for output
  const tempDir = path.join(os.tmpdir(), `e2kb-docling-${Date.now()}`);
  const outputDir = path.join(tempDir, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const title = result.title || file.name.substring(0, file.name.lastIndexOf('.'));
  const markdown = result.markdown;

  if (outputFormat === 'single') {
    const filename = `${sanitizeFilename(title)}.md`;
    fs.writeFileSync(path.join(outputDir, filename), markdown, 'utf-8');
  } else if (outputFormat === 'optimized') {
    const chapters = splitByHeaders(markdown, title);
    const merged = mergeChapters(chapters, maxWords, maxFiles, title);
    fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${file.name}\n`, 'utf-8');
    merged.forEach((chapter, index) => {
      const filename = `${String(index + 1).padStart(2, '0')}_${sanitizeFilename(chapter.title).substring(0, 100)}.md`;
      fs.writeFileSync(path.join(outputDir, filename), chapter.content, 'utf-8');
    });
  } else {
    const chapters = splitByHeaders(markdown, title);
    fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${file.name}\n`, 'utf-8');
    chapters.forEach((chapter, index) => {
      const filename = `${String(index + 1).padStart(3, '0')}_${sanitizeFilename(chapter.title).substring(0, 50)}.md`;
      fs.writeFileSync(path.join(outputDir, filename), chapter.content, 'utf-8');
    });
  }

  // Create ZIP archive
  const zipPath = path.join(tempDir, 'e2kb-output.zip');
  await createZip(outputDir, zipPath);

  const zipBuffer = fs.readFileSync(zipPath);

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="e2kb-${file.name.substring(0, file.name.lastIndexOf('.'))}.zip"`
    }
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*()[\]{}]/g, '')
    .replace(/[,;.!¡¿?'"`´]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

interface Chapter {
  title: string;
  content: string;
  wordCount: number;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function splitByHeaders(markdown: string, docTitle: string): Chapter[] {
  const lines = markdown.split('\n');
  const chapters: Chapter[] = [];
  let currentTitle = docTitle;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for H1 or H2 headers
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h1Match || h2Match) {
      // Save previous chapter if has content
      if (currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content.length > 50) {
          chapters.push({
            title: currentTitle,
            content: content,
            wordCount: countWords(content)
          });
        }
      }
      currentTitle = (h1Match || h2Match)![1];
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget last chapter
  if (currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content.length > 50) {
      chapters.push({
        title: currentTitle,
        content: content,
        wordCount: countWords(content)
      });
    }
  }

  // If no chapters found, return whole document as one
  if (chapters.length === 0) {
    chapters.push({
      title: docTitle,
      content: markdown,
      wordCount: countWords(markdown)
    });
  }

  return chapters;
}

function mergeChapters(chapters: Chapter[], maxWords: number, maxFiles: number, docTitle: string): Chapter[] {
  const merged: Chapter[] = [];
  let currentGroup: Chapter[] = [];
  let currentWordCount = 0;

  for (const chapter of chapters) {
    if (currentWordCount + chapter.wordCount > maxWords && currentGroup.length > 0) {
      // Save current group
      merged.push({
        title: currentGroup[0].title,
        content: currentGroup.map(ch => ch.content).join('\n\n---\n\n'),
        wordCount: currentWordCount
      });
      currentGroup = [chapter];
      currentWordCount = chapter.wordCount;
    } else {
      currentGroup.push(chapter);
      currentWordCount += chapter.wordCount;
    }
  }

  // Last group
  if (currentGroup.length > 0) {
    merged.push({
      title: currentGroup[0].title,
      content: currentGroup.map(ch => ch.content).join('\n\n---\n\n'),
      wordCount: currentWordCount
    });
  }

  if (merged.length > maxFiles) {
    console.warn(`Warning: Generated ${merged.length} files, exceeds maxFiles (${maxFiles})`);
  }

  return merged;
}

function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver.default('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        archive.file(filePath, { name: file });
      }
    }

    archive.finalize();
  });
}
