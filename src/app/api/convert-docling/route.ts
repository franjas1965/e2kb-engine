import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward file to Docling service
    const doclingFormData = new FormData();
    doclingFormData.append('file', file);

    const doclingResponse = await fetch(`${doclingUrl}/convert`, {
      method: 'POST',
      body: doclingFormData,
    });

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
      // Single file output
      const filename = `${sanitizeFilename(title)}.md`;
      fs.writeFileSync(path.join(outputDir, filename), markdown, 'utf-8');
    } else if (outputFormat === 'optimized') {
      // Split by headers and merge based on word limits
      const chapters = splitByHeaders(markdown, title);
      const merged = mergeChapters(chapters, maxWords, maxFiles, title);
      
      // Write index
      fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${file.name}\n`, 'utf-8');
      
      // Write merged chapters
      merged.forEach((chapter, index) => {
        const filename = `${String(index + 1).padStart(2, '0')}_${sanitizeFilename(chapter.title).substring(0, 100)}.md`;
        fs.writeFileSync(path.join(outputDir, filename), chapter.content, 'utf-8');
      });
    } else {
      // Multi-file: split by headers
      const chapters = splitByHeaders(markdown, title);
      
      // Write index
      fs.writeFileSync(path.join(outputDir, '00_Index.md'), `# ${title}\n\nConverted from: ${file.name}\n`, 'utf-8');
      
      // Write each chapter
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

  } catch (error) {
    console.error('Docling conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
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
