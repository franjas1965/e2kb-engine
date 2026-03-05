import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

interface ConversionOptions {
  outputFormat: 'single' | 'multi';
  extractImages: boolean;
  convertWikiLinks: boolean;
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
  
  // Process images
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '\n\n![$2]($1)\n\n');
  result = result.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '\n\n![$1]($2)\n\n');
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (match, src) => {
    const name = src.split('/').pop() || 'image';
    return `\n\n![${name}](${src})\n\n`;
  });
  
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
  const items: TocItem[] = [];
  
  // Parse navPoints recursively
  function parseNavPoints(content: string, level: number): TocItem[] {
    const result: TocItem[] = [];
    const navPointRegex = /<navPoint[^>]*>([\s\S]*?)<\/navPoint>/gi;
    let match;
    
    while ((match = navPointRegex.exec(content)) !== null) {
      const navPointContent = match[1];
      
      // Extract text
      const textMatch = navPointContent.match(/<text[^>]*>([\s\S]*?)<\/text>/i);
      const title = textMatch ? stripHtmlTags(textMatch[1]) : '';
      
      // Extract src
      const srcMatch = navPointContent.match(/<content[^>]*src="([^"]+)"/i);
      const href = srcMatch ? srcMatch[1] : '';
      
      if (title && href) {
        const item: TocItem = { title, href, level, children: [] };
        
        // Check for nested navPoints
        const nestedMatch = navPointContent.match(/<navPoint[^>]*>[\s\S]*<\/navPoint>/gi);
        if (nestedMatch) {
          item.children = parseNavPoints(navPointContent, level + 1);
        }
        
        result.push(item);
      }
    }
    
    return result;
  }
  
  return parseNavPoints(ncxContent, 0);
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
      
      // Extract body
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const html = bodyMatch ? bodyMatch[1] : content;
      
      const markdown = parseHtmlToMarkdown(html);
      
      if (markdown.length > 50) {
        chapters.push({ title, content: markdown, href });
      }
    }
    
    return chapters;
  }

  private generateMarkdown(metadata: Metadata, toc: TocItem[], chapters: Chapter[]): void {
    let md = '';
    
    // Add metadata
    if (metadata.title) md += `**Title:** ${metadata.title}\n`;
    if (metadata.language) md += `**Language:** ${metadata.language}\n`;
    if (metadata.publisher) md += `**Publisher:** ${metadata.publisher}\n`;
    if (metadata.date) md += `**Date:** ${metadata.date}\n`;
    if (metadata.identifier) md += `**Identifier:** ${metadata.identifier}\n`;
    if (metadata.creator) md += `**Creator:** ${metadata.creator}\n`;
    
    if (md) md += '\n';
    
    // Add TOC
    if (toc.length > 0) {
      md += tocToMarkdown(toc);
      md += '\n';
    }
    
    // Add chapters content
    for (const chapter of chapters) {
      md += chapter.content + '\n\n';
    }
    
    // Save
    if (this.options.outputFormat === 'single') {
      fs.writeFileSync(path.join(this.outputDir, 'document.md'), md, 'utf-8');
    } else {
      // Save metadata + TOC as index
      let indexMd = '';
      if (metadata.title) indexMd += `**Title:** ${metadata.title}\n`;
      if (metadata.language) indexMd += `**Language:** ${metadata.language}\n`;
      if (metadata.publisher) indexMd += `**Publisher:** ${metadata.publisher}\n`;
      if (metadata.date) indexMd += `**Date:** ${metadata.date}\n`;
      if (metadata.identifier) indexMd += `**Identifier:** ${metadata.identifier}\n`;
      if (metadata.creator) indexMd += `**Creator:** ${metadata.creator}\n`;
      indexMd += '\n';
      if (toc.length > 0) {
        indexMd += tocToMarkdown(toc);
      }
      fs.writeFileSync(path.join(this.outputDir, '000_index.md'), indexMd, 'utf-8');
      
      // Save each chapter
      chapters.forEach((chapter, index) => {
        const safeTitle = chapter.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
        const fileName = `${String(index + 1).padStart(3, '0')}_${safeTitle}.md`;
        fs.writeFileSync(path.join(this.outputDir, fileName), chapter.content, 'utf-8');
      });
    }
  }

  private async createOutputArchive(): Promise<string> {
    const outputPath = path.join(this.outputDir, 'e2kb-output.zip');
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver.default('zip', { zlib: { level: 9 } });
      output.on('close', () => resolve(outputPath));
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(this.outputDir, false);
      archive.finalize();
    });
  }
}

export async function convertEPUB(bookPath: string, outputDir: string, options?: ConversionOptions): Promise<{ success: boolean; outputPath: string; chapters: number }> {
  const engine = new EPUBCore(bookPath, outputDir, options);
  return engine.process();
}
