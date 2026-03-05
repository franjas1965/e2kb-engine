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

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function processInlineElements(html: string): string {
  let result = html;
  result = result.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  result = result.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  result = result.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  result = result.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  result = result.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  result = result.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (match, href, text) => {
    if (href.startsWith('#') || href.includes('.xhtml') || href.includes('.html')) {
      const cleanHref = href.replace(/^.*\//, '').replace(/\.xhtml?$/, '').replace(/^#/, '');
      return `[[${cleanHref}]]`;
    }
    return `[${text}](${href})`;
  });
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2](/assets/$1)');
  result = result.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1](/assets/$2)');
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (match, src) => `![${path.basename(src)}](/assets/${path.basename(src)})`);
  return stripHtmlTags(result);
}

function convertTableToGfm(tableHtml: string): string {
  const rows: string[][] = [];
  const trMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  trMatches.forEach(tr => {
    const cells: string[] = [];
    const tdMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    tdMatches.forEach(td => {
      const content = td.replace(/<t[dh][^>]*>/i, '').replace(/<\/t[dh]>/i, '');
      cells.push(stripHtmlTags(content));
    });
    if (cells.some(c => c)) rows.push(cells);
  });
  if (rows.length === 0) return '';
  const colCount = Math.max(...rows.map(r => r.length));
  const widths = Array(colCount).fill(0);
  rows.forEach(row => row.forEach((cell, i) => { widths[i] = Math.max(widths[i], cell.length); }));
  const padRow = (row: string[]) => {
    while (row.length < colCount) row.push('');
    return '| ' + row.map((cell, i) => cell.padEnd(widths[i])).join(' | ') + ' |';
  };
  const separator = '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  let result = '\n' + padRow(rows[0]) + '\n' + separator + '\n';
  rows.slice(1).forEach(row => { result += padRow(row) + '\n'; });
  return result + '\n';
}

function parseHtmlToMarkdown(html: string): string {
  let md = '';
  let pos = 0;
  while (pos < html.length) {
    if (html.slice(pos, pos + 4).toLowerCase() === '<h1>') {
      const end = html.indexOf('</h1>', pos);
      if (end !== -1) { md += '\n# ' + stripHtmlTags(html.slice(pos + 4, end)) + '\n\n'; pos = end + 5; continue; }
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<h2>') {
      const end = html.indexOf('</h2>', pos);
      if (end !== -1) { md += '\n## ' + stripHtmlTags(html.slice(pos + 4, end)) + '\n\n'; pos = end + 5; continue; }
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<h3>') {
      const end = html.indexOf('</h3>', pos);
      if (end !== -1) { md += '\n### ' + stripHtmlTags(html.slice(pos + 4, end)) + '\n\n'; pos = end + 5; continue; }
    }
    if (html.slice(pos, pos + 3).toLowerCase() === '<p>') {
      const end = html.indexOf('</p>', pos);
      if (end !== -1) { md += processInlineElements(html.slice(pos + 3, end)) + '\n\n'; pos = end + 4; continue; }
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<ul>') {
      const end = html.indexOf('</ul>', pos);
      if (end !== -1) {
        let listContent = html.slice(pos + 4, end);
        const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        items.forEach(item => { md += '- ' + stripHtmlTags(processInlineElements(item.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, ''))) + '\n'; });
        md += '\n'; pos = end + 5; continue;
      }
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<ol>') {
      const end = html.indexOf('</ol>', pos);
      if (end !== -1) {
        let listContent = html.slice(pos + 4, end);
        const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        items.forEach((item, i) => { md += `${i + 1}. ` + stripHtmlTags(processInlineElements(item.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, ''))) + '\n'; });
        md += '\n'; pos = end + 5; continue;
      }
    }
    if (html.slice(pos, pos + 7).toLowerCase() === '<table>') {
      const end = html.indexOf('</table>', pos);
      if (end !== -1) { md += convertTableToGfm(html.slice(pos, end + 8)) + '\n'; pos = end + 8; continue; }
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<br>' || html.slice(pos, pos + 5).toLowerCase() === '<br/>' || html.slice(pos, pos + 6).toLowerCase() === '<br />') {
      md += '\n'; pos += html.slice(pos, pos + 6).toLowerCase() === '<br />' ? 6 : (html.slice(pos, pos + 5).toLowerCase() === '<br/>' ? 5 : 4); continue;
    }
    if (html.slice(pos, pos + 4).toLowerCase() === '<hr>') { md += '\n---\n\n'; pos += 4; continue; }
    pos++;
  }
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
    const chapters = this.extractChapters(zip);
    this.saveMarkdownFiles(chapters);
    const outputPath = await this.createOutputArchive();
    return { success: true, outputPath, chapters: chapters.length };
  }

  private extractChapters(zip: any): Chapter[] {
    const chapters: Chapter[] = [];
    const zipEntries = zip.getEntries();
    
    // Find container.xml to get rootfile path
    let rootFile = 'OEBPS/content.opf';
    try {
      const containerXml = zip.readAsText('META-INF/container.xml');
      const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
      if (rootfileMatch) rootFile = rootfileMatch[1];
    } catch {}
    
    // Find OPF file
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.opf')) {
        rootFile = entry.entryName;
        break;
      }
    }
    
    let opfContent = '';
    try { opfContent = zip.readAsText(rootFile); } 
    catch { 
      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('.opf')) {
          opfContent = zip.readAsText(entry.entryName);
          rootFile = entry.entryName;
          break;
        }
      }
    }
    
    if (!opfContent) return chapters;
    
    const opfDir = rootFile.substring(0, rootFile.lastIndexOf('/') + 1);
    
    // Extract manifest items
    const manifest: { id: string; href: string; mediaType: string }[] = [];
    const manifestMatches = opfContent.match(/<item[^>]*>/gi) || [];
    manifestMatches.forEach(item => {
      const idMatch = item.match(/id="([^"]+)"/);
      const hrefMatch = item.match(/href="([^"]+)"/);
      const mediaMatch = item.match(/media-type="([^"]+)"/);
      if (idMatch && hrefMatch) {
        manifest.push({ id: idMatch[1], href: hrefMatch[1], mediaType: mediaMatch ? mediaMatch[1] : '' });
      }
    });
    
    // Get title
    let title = 'Document';
    const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i) 
      || opfContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = stripHtmlTags(titleMatch[1]);
    
    // Get spine order
    const manifestMap = new Map(manifest.map(m => [m.id, m]));
    const spineMatches = opfContent.match(/<itemref[^>]*>/gi) || [];
    
    // Process spine items
    for (const itemRef of spineMatches) {
      const idrefMatch = itemRef.match(/idref="([^"]+)"/);
      if (!idrefMatch) continue;
      
      const idref = idrefMatch[1];
      const item = manifestMap.get(idref);
      
      if (!item) continue;
      
      // Check if it's HTML content
      const isHtml = item.href.endsWith('.html') || item.href.endsWith('.xhtml') || item.href.endsWith('.htm');
      if (!isHtml) continue;
      
      try {
        // Try different path combinations
        let chapterContent = '';
        const possiblePaths = [
          opfDir + item.href,
          item.href,
          'OEBPS/' + item.href,
          item.href.replace(/^[^\/]+\//, '')
        ];
        
        for (const chapterPath of possiblePaths) {
          try {
            chapterContent = zip.readAsText(chapterPath);
            if (chapterContent.length > 100) break;
          } catch { continue; }
        }
        
        if (!chapterContent || chapterContent.length < 100) continue;
        
        // Extract title
        let chapterTitle = title;
        const h1Match = chapterContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const h2Match = chapterContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        const h3Match = chapterContent.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
        const titleMatch = chapterContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        
        if (h1Match) chapterTitle = stripHtmlTags(h1Match[1]);
        else if (h2Match) chapterTitle = stripHtmlTags(h2Match[1]);
        else if (h3Match) chapterTitle = stripHtmlTags(h3Match[1]);
        else if (titleMatch) chapterTitle = stripHtmlTags(titleMatch[1]);
        
        // Extract body content
        let html = '';
        const bodyMatch = chapterContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          html = bodyMatch[1];
        } else {
          // Try to get content from divs
          const divMatches = chapterContent.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (divMatches) html = divMatches[1];
          else {
            // Get everything between body tags or main content
            const mainMatch = chapterContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
            if (mainMatch) html = mainMatch[1];
            else html = chapterContent;
          }
        }
        
        const markdown = parseHtmlToMarkdown(html);
        
        if (markdown.length > 10) {
          chapters.push({ title: chapterTitle, content: markdown, href: item.href });
        }
      } catch (e) { /* Skip problematic chapters */ }
    }
    
    // If no chapters from spine, try to get all HTML files
    if (chapters.length === 0) {
      for (const entry of zipEntries) {
        const name = entry.entryName.toLowerCase();
        if (name.endsWith('.html') || name.endsWith('.xhtml')) {
          try {
            const content = zip.readAsText(entry.entryName);
            if (content.length > 500) {
              let chapterTitle = 'Chapter ' + (chapters.length + 1);
              const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
              const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
              if (h1Match) chapterTitle = stripHtmlTags(h1Match[1]);
              else if (h2Match) chapterTitle = stripHtmlTags(h2Match[1]);
              
              const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              const html = bodyMatch ? bodyMatch[1] : content;
              const markdown = parseHtmlToMarkdown(html);
              
              if (markdown.length > 10) {
                chapters.push({ title: chapterTitle, content: markdown, href: entry.entryName });
              }
            }
          } catch {}
        }
      }
    }
    
    return chapters;
  }

  private saveMarkdownFiles(chapters: Chapter[]): void {
    if (chapters.length === 0) { fs.writeFileSync(path.join(this.outputDir, 'document.md'), '# Empty Document', 'utf-8'); return; }
    if (this.options.outputFormat === 'single') {
      let combined = `# ${chapters[0].title}\n\n`;
      chapters.forEach((chapter, index) => {
        if (index > 0) combined += `\n\n---\n\n## ${chapter.title}\n\n`;
        combined += chapter.content;
      });
      fs.writeFileSync(path.join(this.outputDir, 'document.md'), combined, 'utf-8');
    } else {
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
