import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

interface ConversionOptions {
  outputFormat: 'single' | 'multi' | 'optimized';
  extractImages: boolean;
  convertWikiLinks: boolean;
  maxWords?: number;
  maxFiles?: number;
}

interface MergedChapter {
  title: string;
  content: string;
  chapterRange: string;
  wordCount: number;
}

interface Chapter {
  title: string;
  content: string;
  href: string;
}

interface Metadata {
  title: string;
  language: string;
  publisher: string;
  date: string;
  identifier: string;
  creator: string;
}

interface TocItem {
  title: string;
  href: string;
  level: number;
  children: TocItem[];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*()[\]{}]/g, '')
    .replace(/[,;.!¡¿?'"`´]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function generateDescriptiveFilename(
  docTitle: string,
  chapters: Chapter[],
  startIndex: number,
  endIndex: number,
  fileIndex: number,
  totalFiles: number
): string {
  const padding = String(totalFiles).length;
  const indexStr = String(fileIndex + 1).padStart(padding, '0');
  
  // Extract document abbreviation (first letters of main words, max 10 chars)
  const cleanTitle = docTitle.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  const docAbbrev = cleanTitle
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => w[0].toUpperCase())
    .join('')
    .substring(0, 10) || 'DOC';
  
  // Chapter range
  const rangeStr = startIndex === endIndex 
    ? `Cap${String(startIndex + 1).padStart(2, '0')}`
    : `Cap${String(startIndex + 1).padStart(2, '0')}-${String(endIndex + 1).padStart(2, '0')}`;
  
  // First chapter title (sanitized and truncated)
  const firstTitle = sanitizeFilename(chapters[startIndex].title).substring(0, 100);
  
  // Build filename
  let filename = `${indexStr}_${docAbbrev}_${rangeStr}_${firstTitle}`;
  
  // Ensure max 254 chars (leaving room for .md extension)
  if (filename.length > 250) {
    filename = filename.substring(0, 250);
  }
  
  return filename + '.md';
}

function mergeChapters(
  chapters: Chapter[],
  maxWords: number,
  maxFiles: number,
  docTitle: string
): MergedChapter[] {
  const merged: MergedChapter[] = [];
  let currentGroup: Chapter[] = [];
  let currentWordCount = 0;
  let startIndex = 0;
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const chapterWords = countWords(chapter.content);
    
    // If adding this chapter exceeds maxWords, close current group
    if (currentWordCount + chapterWords > maxWords && currentGroup.length > 0) {
      // Save current group
      const endIndex = i - 1;
      merged.push({
        title: generateDescriptiveFilename(docTitle, chapters, startIndex, endIndex, merged.length, 0),
        content: currentGroup.map((ch, idx) => {
          const separator = idx > 0 ? '\n\n---\n\n' : '';
          return `${separator}# ${ch.title}\n\n${ch.content}`;
        }).join(''),
        chapterRange: `${startIndex + 1}-${endIndex + 1}`,
        wordCount: currentWordCount
      });
      
      // Start new group
      currentGroup = [chapter];
      currentWordCount = chapterWords;
      startIndex = i;
    } else {
      // Add to current group
      currentGroup.push(chapter);
      currentWordCount += chapterWords;
    }
  }
  
  // Don't forget the last group
  if (currentGroup.length > 0) {
    const endIndex = chapters.length - 1;
    merged.push({
      title: generateDescriptiveFilename(docTitle, chapters, startIndex, endIndex, merged.length, 0),
      content: currentGroup.map((ch, idx) => {
        const separator = idx > 0 ? '\n\n---\n\n' : '';
        return `${separator}# ${ch.title}\n\n${ch.content}`;
      }).join(''),
      chapterRange: `${startIndex + 1}-${endIndex + 1}`,
      wordCount: currentWordCount
    });
  }
  
  // Update filenames with correct total count
  const totalFiles = merged.length;
  merged.forEach((m, idx) => {
    const parts = m.title.split('_');
    const padding = String(totalFiles).length;
    parts[0] = String(idx + 1).padStart(padding, '0');
    m.title = parts.join('_');
  });
  
  // Check if we exceed maxFiles
  if (merged.length > maxFiles) {
    console.warn(`Warning: Generated ${merged.length} files, exceeds maxFiles (${maxFiles}). Consider increasing maxWords.`);
  }
  
  return merged;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
  ).trim();
}

function parseHtmlToMarkdown(html: string): string {
  let result = html;
  
  // Remove scripts and styles
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove images completely - they are noise for RAG systems
  // Base64 images especially contaminate embeddings and increase file size
  result = result.replace(/<img[^>]*>/gi, '');
  
  // Process links - convert to standard markdown links
  result = result.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (match, href, text) => {
    const cleanText = stripHtmlTags(text);
    return `[${cleanText}](${href})`;
  });
  
  // Process inline elements
  result = result.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  result = result.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  result = result.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  result = result.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  result = result.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  
  // Process headings
  result = result.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (m, c) => `\n\n${stripHtmlTags(c)}\n\n`);
  result = result.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, c) => `\n\n${stripHtmlTags(c)}\n\n`);
  result = result.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, c) => `\n\n${stripHtmlTags(c)}\n\n`);
  result = result.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (m, c) => `\n\n${stripHtmlTags(c)}\n\n`);
  
  // Process lists
  result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    let listMd = '\n';
    items.forEach((item: string) => {
      const text = stripHtmlTags(item.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, ''));
      listMd += `- ${text}\n`;
    });
    return listMd + '\n';
  });
  
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    let listMd = '\n';
    items.forEach((item: string, i: number) => {
      const text = stripHtmlTags(item.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, ''));
      listMd += `${i + 1}. ${text}\n`;
    });
    return listMd + '\n';
  });
  
  // Process paragraphs - each paragraph on its own line with blank line after
  result = result.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    if (text.trim().length > 0) {
      return `\n\n${text}\n`;
    }
    return '';
  });
  
  // Process divs - just extract content
  result = result.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1');
  
  // Process spans
  result = result.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  
  // Process line breaks
  result = result.replace(/<br\s*\/?>/gi, '\n');
  
  // Process horizontal rules
  result = result.replace(/<hr[^>]*\/?>/gi, '\n\n---\n\n');
  
  // Clean remaining tags
  result = stripHtmlTags(result);
  
  // Clean up whitespace - normalize newlines
  result = result.replace(/\r\n/g, '\n');
  result = result.replace(/[ \t]+\n/g, '\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

function parseTocFromNcx(ncxContent: string): TocItem[] {
  // Find all navPoints with their positions to handle nesting
  function findNavPoints(content: string): { start: number; end: number; content: string }[] {
    const points: { start: number; end: number; content: string }[] = [];
    const openTag = /<navPoint[^>]*>/gi;
    const closeTag = /<\/navPoint>/gi;
    
    let match;
    const opens: number[] = [];
    const closes: number[] = [];
    
    while ((match = openTag.exec(content)) !== null) {
      opens.push(match.index);
    }
    while ((match = closeTag.exec(content)) !== null) {
      closes.push(match.index + match[0].length);
    }
    
    // Match opens with closes using stack
    const stack: number[] = [];
    const pairs: { start: number; end: number }[] = [];
    
    let openIdx = 0;
    let closeIdx = 0;
    
    while (openIdx < opens.length || closeIdx < closes.length) {
      if (openIdx < opens.length && (closeIdx >= closes.length || opens[openIdx] < closes[closeIdx])) {
        stack.push(opens[openIdx]);
        openIdx++;
      } else if (closeIdx < closes.length) {
        if (stack.length > 0) {
          const start = stack.pop()!;
          pairs.push({ start, end: closes[closeIdx] });
        }
        closeIdx++;
      }
    }
    
    // Sort by start position
    pairs.sort((a, b) => a.start - b.start);
    
    for (const pair of pairs) {
      points.push({
        start: pair.start,
        end: pair.end,
        content: content.substring(pair.start, pair.end)
      });
    }
    
    return points;
  }
  
  function parseNavPoint(navPointHtml: string, level: number): TocItem | null {
    // Extract navLabel > text
    const textMatch = navPointHtml.match(/<navLabel[^>]*>[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>/i);
    const title = textMatch ? stripHtmlTags(textMatch[1]) : '';
    
    // Extract content src
    const srcMatch = navPointHtml.match(/<content[^>]*src="([^"]+)"/i);
    const href = srcMatch ? srcMatch[1] : '';
    
    if (!title || !href) return null;
    
    const item: TocItem = { title, href, level, children: [] };
    
    // Find direct child navPoints (not nested deeper)
    // Get position after the first </content> tag
    const contentEndMatch = navPointHtml.match(/<content[^>]*\/?>|<\/content>/i);
    if (contentEndMatch) {
      const afterContent = navPointHtml.substring(contentEndMatch.index! + contentEndMatch[0].length);
      
      // Find child navPoints
      const childPoints = findNavPoints(afterContent);
      
      // Only process top-level children (those not contained in other navPoints)
      const topLevelChildren: string[] = [];
      for (let i = 0; i < childPoints.length; i++) {
        let isNested = false;
        for (let j = 0; j < childPoints.length; j++) {
          if (i !== j && 
              childPoints[i].start > childPoints[j].start && 
              childPoints[i].end < childPoints[j].end) {
            isNested = true;
            break;
          }
        }
        if (!isNested) {
          topLevelChildren.push(childPoints[i].content);
        }
      }
      
      for (const childHtml of topLevelChildren) {
        const childItem = parseNavPoint(childHtml, level + 1);
        if (childItem) {
          item.children.push(childItem);
        }
      }
    }
    
    return item;
  }
  
  // Find the navMap
  const navMapMatch = ncxContent.match(/<navMap[^>]*>([\s\S]*?)<\/navMap>/i);
  if (!navMapMatch) return [];
  
  const navMapContent = navMapMatch[1];
  
  // Find all top-level navPoints in navMap
  const allPoints = findNavPoints(navMapContent);
  
  // Filter to only top-level (not nested in other navPoints)
  const topLevelPoints: string[] = [];
  for (let i = 0; i < allPoints.length; i++) {
    let isNested = false;
    for (let j = 0; j < allPoints.length; j++) {
      if (i !== j && 
          allPoints[i].start > allPoints[j].start && 
          allPoints[i].end < allPoints[j].end) {
        isNested = true;
        break;
      }
    }
    if (!isNested) {
      topLevelPoints.push(allPoints[i].content);
    }
  }
  
  const result: TocItem[] = [];
  for (const pointHtml of topLevelPoints) {
    const item = parseNavPoint(pointHtml, 0);
    if (item) {
      result.push(item);
    }
  }
  
  return result;
}

function tocToMarkdown(items: TocItem[], indent: number = 0): string {
  let md = '';
  const prefix = '   '.repeat(indent);
  
  items.forEach((item, index) => {
    md += `${prefix}${index + 1}. [${item.title}](${item.href})\n`;
    if (item.children.length > 0) {
      md += tocToMarkdown(item.children, indent + 1);
    }
  });
  
  return md;
}

export class EPUBCore {
  private bookPath: string;
  private outputDir: string;
  private options: ConversionOptions;

  constructor(bookPath: string, outputDir: string, options: ConversionOptions = { outputFormat: 'multi', extractImages: true, convertWikiLinks: true }) {
    this.bookPath = bookPath;
    this.outputDir = outputDir;
    this.options = options;
  }

  async process(): Promise<{ success: boolean; outputPath: string; chapters: number }> {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(this.bookPath);
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    
    // Extract metadata
    const metadata = this.extractMetadata(zip);
    
    // Extract TOC
    const toc = this.extractToc(zip);
    
    // Extract chapters
    const chapters = this.extractChapters(zip);
    
    // Generate markdown
    this.generateMarkdown(metadata, toc, chapters);
    
    const outputPath = await this.createOutputArchive();
    return { success: true, outputPath, chapters: chapters.length };
  }

  private extractMetadata(zip: any): Metadata {
    const metadata: Metadata = {
      title: '',
      language: '',
      publisher: '',
      date: '',
      identifier: '',
      creator: ''
    };
    
    const zipEntries = zip.getEntries();
    
    // Find OPF file
    let opfContent = '';
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.opf')) {
        opfContent = zip.readAsText(entry.entryName);
        break;
      }
    }
    
    if (opfContent) {
      const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
      if (titleMatch) metadata.title = stripHtmlTags(titleMatch[1]);
      
      const langMatch = opfContent.match(/<dc:language[^>]*>([\s\S]*?)<\/dc:language>/i);
      if (langMatch) metadata.language = stripHtmlTags(langMatch[1]);
      
      const pubMatch = opfContent.match(/<dc:publisher[^>]*>([\s\S]*?)<\/dc:publisher>/i);
      if (pubMatch) metadata.publisher = stripHtmlTags(pubMatch[1]);
      
      const dateMatch = opfContent.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      if (dateMatch) metadata.date = stripHtmlTags(dateMatch[1]);
      
      const idMatch = opfContent.match(/<dc:identifier[^>]*>([\s\S]*?)<\/dc:identifier>/i);
      if (idMatch) metadata.identifier = stripHtmlTags(idMatch[1]);
      
      const creatorMatch = opfContent.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
      if (creatorMatch) metadata.creator = stripHtmlTags(creatorMatch[1]);
    }
    
    return metadata;
  }

  private extractToc(zip: any): TocItem[] {
    const zipEntries = zip.getEntries();
    
    // Find NCX file
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.ncx')) {
        const ncxContent = zip.readAsText(entry.entryName);
        return parseTocFromNcx(ncxContent);
      }
    }
    
    return [];
  }

  private extractChapters(zip: any): Chapter[] {
    const chapters: Chapter[] = [];
    const zipEntries = zip.getEntries();
    const processedHrefs = new Set<string>();
    
    // Find OPF and get spine order
    let opfContent = '';
    let opfDir = '';
    
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.opf')) {
        opfContent = zip.readAsText(entry.entryName);
        opfDir = entry.entryName.substring(0, entry.entryName.lastIndexOf('/') + 1);
        break;
      }
    }
    
    if (!opfContent) return chapters;
    
    // Build manifest map
    const manifest = new Map<string, string>();
    const manifestMatches = opfContent.match(/<item[^>]*>/gi) || [];
    manifestMatches.forEach(item => {
      const idMatch = item.match(/id="([^"]+)"/);
      const hrefMatch = item.match(/href="([^"]+)"/);
      if (idMatch && hrefMatch) {
        manifest.set(idMatch[1], hrefMatch[1]);
      }
    });
    
    // Get spine order
    const spineMatches = opfContent.match(/<itemref[^>]*idref="([^"]+)"[^>]*>/gi) || [];
    
    for (const itemRef of spineMatches) {
      const idrefMatch = itemRef.match(/idref="([^"]+)"/);
      if (!idrefMatch) continue;
      
      const href = manifest.get(idrefMatch[1]);
      if (!href) continue;
      
      // Skip non-HTML files
      if (!href.endsWith('.html') && !href.endsWith('.xhtml') && !href.endsWith('.htm')) continue;
      
      // Skip TOC/nav/cover files
      const lowerHref = href.toLowerCase();
      if (lowerHref.includes('toc') || lowerHref.includes('nav') || 
          lowerHref.includes('cover') || lowerHref.includes('portada') ||
          lowerHref.includes('primeras')) continue;
      
      // Skip already processed
      if (processedHrefs.has(href)) continue;
      processedHrefs.add(href);
      
      // Try to read the file
      const possiblePaths = [opfDir + href, href, 'OEBPS/' + href];
      let content = '';
      
      for (const p of possiblePaths) {
        try {
          content = zip.readAsText(p);
          if (content.length > 100) break;
        } catch {}
      }
      
      if (!content || content.length < 100) continue;
      
      // Extract title
      let title = href.replace(/.*\//, '').replace(/\.xhtml?$/, '');
      const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) title = stripHtmlTags(titleMatch[1]);
      
      // Extract body and remove nav/toc elements
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let html = bodyMatch ? bodyMatch[1] : content;
      
      // Remove nav elements (TOC lists inside content)
      html = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
      html = html.replace(/<ol[^>]*class="[^"]*toc[^"]*"[^>]*>[\s\S]*?<\/ol>/gi, '');
      html = html.replace(/<ul[^>]*class="[^"]*toc[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '');
      
      const markdown = parseHtmlToMarkdown(html);
      
      if (markdown.length > 50) {
        chapters.push({ title, content: markdown, href });
      }
    }
    
    return chapters;
  }

  private generateMarkdown(metadata: Metadata, toc: TocItem[], chapters: Chapter[]): void {
    // Build metadata block
    let metadataMd = '';
    if (metadata.title) metadataMd += `**Title:** ${metadata.title}\n`;
    if (metadata.language) metadataMd += `**Language:** ${metadata.language}\n`;
    if (metadata.publisher) metadataMd += `**Publisher:** ${metadata.publisher}\n`;
    if (metadata.date) metadataMd += `**Date:** ${metadata.date}\n`;
    if (metadata.identifier) metadataMd += `**Identifier:** ${metadata.identifier}\n`;
    if (metadata.creator) metadataMd += `**Creator:** ${metadata.creator}\n`;
    if (metadataMd) metadataMd += '\n';
    
    // Build TOC block
    let tocMd = '';
    if (toc.length > 0) {
      tocMd = tocToMarkdown(toc) + '\n';
    }
    
    if (this.options.outputFormat === 'single') {
      // Single file mode
      let md = metadataMd + tocMd;
      for (const chapter of chapters) {
        md += chapter.content + '\n\n';
      }
      fs.writeFileSync(path.join(this.outputDir, 'document.md'), md, 'utf-8');
      
    } else if (this.options.outputFormat === 'optimized') {
      // Optimized mode: merge chapters based on limits
      const maxWords = this.options.maxWords || 400000;
      const maxFiles = this.options.maxFiles || 50;
      const docTitle = metadata.title || 'Document';
      
      const mergedChapters = mergeChapters(chapters, maxWords, maxFiles, docTitle);
      
      // Save index with metadata and TOC
      const indexMd = metadataMd + tocMd;
      fs.writeFileSync(path.join(this.outputDir, '00_Index.md'), indexMd, 'utf-8');
      
      // Save merged chapters with descriptive filenames
      mergedChapters.forEach((merged) => {
        fs.writeFileSync(path.join(this.outputDir, merged.title), merged.content, 'utf-8');
      });
      
      console.log(`📊 Optimized output: ${mergedChapters.length} files from ${chapters.length} chapters`);
      
    } else {
      // Multi mode: one file per chapter
      const indexMd = metadataMd + tocMd;
      fs.writeFileSync(path.join(this.outputDir, '000_index.md'), indexMd, 'utf-8');
      
      const docTitle = metadata.title || 'Document';
      const totalFiles = chapters.length;
      
      chapters.forEach((chapter, index) => {
        const filename = generateDescriptiveFilename(docTitle, chapters, index, index, index, totalFiles);
        fs.writeFileSync(path.join(this.outputDir, filename), chapter.content, 'utf-8');
      });
    }
  }

  private async createOutputArchive(): Promise<string> {
    const outputPath = path.join(this.outputDir, 'e2kb-output.zip');
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver.default('zip', { zlib: { level: 9 } });
      
      output.on('close', () => resolve(outputPath));
      output.on('error', reject);
      archive.on('error', reject);
      archive.on('warning', (err) => {
        if (err.code !== 'ENOENT') {
          console.warn('Archive warning:', err);
        }
      });
      
      archive.pipe(output);
      
      // Add files individually, excluding the zip file itself
      const files = fs.readdirSync(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.zip')) continue;
        const filePath = path.join(this.outputDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          archive.file(filePath, { name: file });
        }
      }
      
      archive.finalize();
    });
  }
}

export async function convertEPUB(bookPath: string, outputDir: string, options?: ConversionOptions): Promise<{ success: boolean; outputPath: string; chapters: number }> {
  const engine = new EPUBCore(bookPath, outputDir, options);
  return engine.process();
}
