"""
E2KB Docling Service - Document Conversion with API-based VLM Support
Supports: PDF, DOCX, PPTX, XLSX, images (with OCR), HTML

Architecture:
- EPUB: Handled by Node.js (not this service)
- PDF with images: Claude/OpenAI API for full page processing
- PDF text-only: OCR extraction with structured Markdown
- Other formats: Docling standard conversion
"""

import os
import time
import base64
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from enum import Enum

import httpx
import fitz  # PyMuPDF

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode

# =============================================================================
# CONFIGURATION
# =============================================================================

# API Keys (from environment variables)
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# API URLs
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Models - Haiku es más económico y suficiente para OCR de fórmulas
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-3-5-haiku-20241022")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

# Processing settings
PAGE_RENDER_SCALE = 3.0  # Higher = better quality, more tokens
MIN_TEXT_CHARS = 50  # Minimum chars to consider page has text
IMAGE_COVERAGE_THRESHOLD = 0.05  # 5% coverage = has significant images

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="E2KB Docling Service",
    description="Document conversion with optional VLM API support",
    version="2.0.0"
)

# Supported formats
SUPPORTED_EXTENSIONS = {
    '.pdf': InputFormat.PDF,
    '.docx': InputFormat.DOCX,
    '.pptx': InputFormat.PPTX,
    '.xlsx': InputFormat.XLSX,
    '.html': InputFormat.HTML,
    '.htm': InputFormat.HTML,
    '.png': InputFormat.IMAGE,
    '.jpg': InputFormat.IMAGE,
    '.jpeg': InputFormat.IMAGE,
    '.tiff': InputFormat.IMAGE,
    '.bmp': InputFormat.IMAGE,
    '.md': InputFormat.MD,
    '.asciidoc': InputFormat.ASCIIDOC,
}

# =============================================================================
# MODELS
# =============================================================================

class ProcessingMode(str, Enum):
    BASIC = "basic"      # OCR only, free
    PREMIUM = "premium"  # VLM API for images/formulas

class ConversionResult(BaseModel):
    success: bool
    markdown: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None
    word_count: Optional[int] = None
    processing_mode: Optional[str] = None
    pages_processed: Optional[int] = None
    estimated_cost: Optional[float] = None

class DocumentAnalysis(BaseModel):
    pages: int
    has_images: bool
    has_text: bool
    total_images: int
    pages_with_images: int
    text_coverage: float
    recommended_mode: str
    estimated_cost_premium: float

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())


def get_available_api() -> Optional[str]:
    """Check which API is configured"""
    if CLAUDE_API_KEY:
        return "claude"
    elif OPENAI_API_KEY:
        return "openai"
    return None


# =============================================================================
# PDF ANALYSIS
# =============================================================================

def analyze_pdf(pdf_path: Path) -> Dict[str, Any]:
    """
    Quick analysis of PDF to determine content type and recommend processing mode.
    """
    doc = fitz.open(str(pdf_path))
    page_count = len(doc)
    
    total_text_chars = 0
    total_images = 0
    pages_with_images = 0
    pages_with_text = 0
    
    for page in doc:
        # Check text
        text = page.get_text("text").strip()
        text_len = len(text)
        total_text_chars += text_len
        if text_len >= MIN_TEXT_CHARS:
            pages_with_text += 1
        
        # Check images
        images = page.get_images(full=True)
        img_count = len(images)
        total_images += img_count
        
        if img_count > 0:
            # Calculate image coverage
            page_rect = page.rect
            page_area = page_rect.width * page_rect.height
            total_img_area = 0
            
            for img in images:
                try:
                    xref = img[0]
                    for rect in page.get_image_rects(xref):
                        total_img_area += rect.width * rect.height
                except:
                    pass
            
            if page_area > 0 and (total_img_area / page_area) >= IMAGE_COVERAGE_THRESHOLD:
                pages_with_images += 1
    
    doc.close()
    
    has_images = pages_with_images > 0
    has_text = pages_with_text > 0
    text_coverage = pages_with_text / page_count if page_count > 0 else 0
    
    # Determine recommendation
    if has_images:
        recommended_mode = "premium"
        reason = f"Documento con {total_images} imágenes en {pages_with_images} páginas. Se recomienda procesamiento Premium para extraer fórmulas y diagramas."
    else:
        recommended_mode = "basic"
        reason = "Documento solo texto. El procesamiento básico es suficiente."
    
    # Estimate cost (Claude: ~$0.015 per page with images)
    estimated_cost = pages_with_images * 0.015 if has_images else 0
    
    return {
        "pages": page_count,
        "has_images": has_images,
        "has_text": has_text,
        "total_images": total_images,
        "pages_with_images": pages_with_images,
        "pages_with_text": pages_with_text,
        "text_coverage": text_coverage,
        "recommended_mode": recommended_mode,
        "recommendation_reason": reason,
        "estimated_cost_premium": round(estimated_cost, 3),
    }


# =============================================================================
# BASIC PROCESSING (FREE - DOCLING STRUCTURED)
# =============================================================================

import re

def convert_pdf_with_docling_basic(pdf_path: Path) -> tuple[str, int]:
    """
    Convert PDF using Docling for better structure detection.
    Returns (markdown, page_count)
    """
    try:
        # Configure Docling for optimal structure extraction
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_table_structure = True
        pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
        
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        
        logger.info(f"📄 Converting PDF with Docling: {pdf_path.name}")
        result = converter.convert(str(pdf_path))
        
        # Get page count
        doc = fitz.open(str(pdf_path))
        page_count = len(doc)
        
        # Check for images
        total_images = 0
        for page in doc:
            total_images += len(page.get_images())
        doc.close()
        
        # Export to markdown
        markdown = result.document.export_to_markdown()
        
        # Post-process to improve structure
        markdown = improve_markdown_structure(markdown, pdf_path.stem)
        
        # Add note about images if present
        if total_images > 0:
            markdown += f"\n\n---\n*[Este documento contiene {total_images} imagen(es). Usar modo Premium para extraer fórmulas y diagramas.]*\n"
        
        logger.info(f"✅ Docling conversion complete: {len(markdown)} chars, {page_count} pages")
        return markdown, page_count
        
    except Exception as e:
        logger.error(f"Docling conversion failed: {e}, falling back to PyMuPDF")
        return extract_pdf_text_pymupdf(pdf_path)


def improve_markdown_structure(markdown: str, title: str) -> str:
    """
    Post-process markdown to improve hierarchical structure.
    Detects numbered sections and converts to proper headings.
    """
    lines = markdown.split('\n')
    improved_lines = []
    
    # Patterns for section detection
    # Matches: "1.", "1.1", "1.1.1", "2.3.4.5", etc.
    section_pattern = re.compile(r'^(\d+(?:\.\d+)*)\s+(.+)$')
    # Matches: "a)", "b)", "(a)", "(1)", etc.
    list_item_pattern = re.compile(r'^[\(\[]?[a-zA-Z0-9][\)\]]\s+')
    # Matches: "- ", "• ", "* "
    bullet_pattern = re.compile(r'^[-•*]\s+')
    
    for line in lines:
        stripped = line.strip()
        
        if not stripped:
            improved_lines.append('')
            continue
        
        # Check for numbered sections
        match = section_pattern.match(stripped)
        if match:
            section_num = match.group(1)
            section_text = match.group(2)
            depth = section_num.count('.')
            
            # Determine heading level based on depth
            if depth == 0:
                # Main section: "1 Title" -> "## 1. Title"
                improved_lines.append(f"\n## {section_num}. {section_text}\n")
            elif depth == 1:
                # Subsection: "1.1 Title" -> "### 1.1 Title"
                improved_lines.append(f"\n### {section_num} {section_text}\n")
            elif depth == 2:
                # Sub-subsection: "1.1.1 Title" -> "#### 1.1.1 Title"
                improved_lines.append(f"\n#### {section_num} {section_text}\n")
            else:
                # Deeper levels: bold text
                improved_lines.append(f"\n**{section_num} {section_text}**\n")
        elif list_item_pattern.match(stripped):
            # Convert to proper list item
            improved_lines.append(f"- {stripped}")
        elif bullet_pattern.match(stripped):
            # Already a bullet, keep as is
            improved_lines.append(line)
        else:
            improved_lines.append(line)
    
    result = '\n'.join(improved_lines)
    
    # Ensure title at the top
    if not result.startswith('# '):
        result = f"# {title}\n\n{result}"
    
    # Clean up excessive newlines
    result = re.sub(r'\n{4,}', '\n\n\n', result)
    
    return result


def extract_pdf_text_pymupdf(pdf_path: Path) -> tuple[str, int]:
    """
    Fallback: Extract text from PDF with PyMuPDF.
    Returns (markdown, page_count)
    """
    doc = fitz.open(str(pdf_path))
    page_count = len(doc)
    markdown_parts = [f"# {pdf_path.stem}\n"]
    
    for page_num, page in enumerate(doc, 1):
        text = page.get_text("text").strip()
        if text:
            markdown_parts.append(f"\n---\n**Página {page_num}**\n\n{text}")
        
        images = page.get_images()
        if images:
            markdown_parts.append(f"\n*[{len(images)} imagen(es) - usar modo Premium]*\n")
    
    doc.close()
    return "\n".join(markdown_parts), page_count


# =============================================================================
# PREMIUM PROCESSING (API - FULL PAGE VLM)
# =============================================================================

VLM_PROMPT = """Eres un experto en conversión de documentos técnicos a Markdown estructurado.

Convierte esta imagen de página a Markdown siguiendo estas reglas ESTRICTAS:

## ESTRUCTURA
- Jerarquía de títulos: # Principal, ## Secciones, ### Subsecciones
- Secciones numeradas: "2.1 Título" → "### 2.1 Título"
- **Negrita** para términos importantes
- *Cursiva* para variables

## FÓRMULAS MATEMÁTICAS (MUY IMPORTANTE)
- SIEMPRE usa $$ en líneas separadas para fórmulas en bloque
- NUNCA pongas texto después de $$ en la misma línea
- NUNCA uses \\over - siempre usa \\frac{numerador}{denominador}
- NUNCA uses \\displaylines - usa \\begin{aligned} o fórmulas separadas
- NUNCA uses & fuera de entornos aligned, cases, matrix
- Formato OBLIGATORIO para cada fórmula:

$$
FORMULA_LATEX
$$

> **(Fórmula N)**

- OBLIGATORIO: \\frac{a}{b} para fracciones (NO \\over)
- Usa \\text{} para texto dentro de fórmulas
- Subíndices: L_{den}, RR_{ECI,vial}
- Para fórmulas condicionales usa \\begin{cases}...\\end{cases}
- Para múltiples líneas alineadas usa \\begin{aligned}...\\end{aligned}

## CONTENIDO
- NO omitas ningún texto visible
- Preserva listas con viñetas usando -
- Tablas en formato Markdown GFM

## SALIDA
- SOLO Markdown puro, sin explicaciones
- Cada fórmula DEBE estar en su propio bloque $$"""


async def process_page_with_claude(image_base64: str, page_num: int) -> str:
    """Process a single page image with Claude API"""
    
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    
    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 4096,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": VLM_PROMPT,
                    },
                ],
            }
        ],
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(CLAUDE_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [])
                if content and content[0].get("type") == "text":
                    return content[0].get("text", "")
            else:
                logger.error(f"Claude API error: {response.status_code} - {response.text}")
                return f"[Error procesando página {page_num}]"
                
    except Exception as e:
        logger.error(f"Error calling Claude API: {e}")
        return f"[Error procesando página {page_num}: {str(e)}]"
    
    return ""


async def process_page_with_openai(image_base64: str, page_num: int) -> str:
    """Process a single page image with OpenAI API"""
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": OPENAI_MODEL,
        "max_tokens": 4096,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}",
                        },
                    },
                    {
                        "type": "text",
                        "text": VLM_PROMPT,
                    },
                ],
            }
        ],
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OPENAI_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return f"[Error procesando página {page_num}]"
                
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {e}")
        return f"[Error procesando página {page_num}: {str(e)}]"
    
    return ""


def page_has_significant_images(page, min_coverage: float = 0.02) -> bool:
    """
    Check if a page has significant images (formulas, diagrams, etc.)
    Returns True if images cover more than min_coverage of the page area.
    """
    images = page.get_images()
    if not images:
        return False
    
    page_area = page.rect.width * page.rect.height
    total_image_area = 0
    
    for img in images:
        try:
            xref = img[0]
            img_rect = page.get_image_rects(xref)
            if img_rect:
                for rect in img_rect:
                    total_image_area += rect.width * rect.height
        except:
            # If we can't get rect, assume it's significant
            return True
    
    coverage = total_image_area / page_area if page_area > 0 else 0
    return coverage > min_coverage


def convert_single_page_with_docling(doc, page_num: int, temp_dir: Path) -> str:
    """
    Extract a single page as temporary PDF and process with Docling.
    This gives full Docling structure for text-only pages.
    """
    import tempfile
    
    try:
        # Create a new PDF with just this page
        temp_pdf_path = temp_dir / f"page_{page_num + 1}.pdf"
        
        # Create single-page PDF
        single_page_doc = fitz.open()
        single_page_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
        single_page_doc.save(str(temp_pdf_path))
        single_page_doc.close()
        
        # Process with Docling
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_table_structure = True
        pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
        
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        
        result = converter.convert(str(temp_pdf_path))
        markdown = result.document.export_to_markdown()
        
        # Clean up temp file
        temp_pdf_path.unlink(missing_ok=True)
        
        # Apply structure improvements
        markdown = improve_markdown_structure(markdown, f"page_{page_num + 1}")
        
        return markdown
        
    except Exception as e:
        logger.warning(f"Docling failed for page {page_num + 1}: {e}, using PyMuPDF fallback")
        # Fallback to PyMuPDF text extraction
        page = doc[page_num]
        return page.get_text("text").strip()


async def convert_pdf_premium(pdf_path: Path, api: str) -> tuple[str, int, dict]:
    """
    Convert PDF using HYBRID mode (OPTIMIZED):
    - Pages WITH images: Use Claude API (full page with structure)
    - Pages WITHOUT images: Use Docling in BATCH (single PDF for all text pages)
    
    All pages combined IN ORDER to maintain document flow.
    
    Returns (markdown, page_count, stats)
    """
    import tempfile
    
    doc = fitz.open(str(pdf_path))
    page_count = len(doc)
    
    # First pass: analyze which pages have images
    pages_with_images_list = []
    pages_without_images_list = []
    
    logger.info(f"🔍 Analyzing {page_count} pages for images...")
    
    for page_num in range(page_count):
        page = doc[page_num]
        if page_has_significant_images(page):
            pages_with_images_list.append(page_num)
        else:
            pages_without_images_list.append(page_num)
    
    logger.info(f"📊 Analysis: {len(pages_with_images_list)} pages with images, {len(pages_without_images_list)} pages text-only")
    
    # Stats for cost estimation
    stats = {
        "total_pages": page_count,
        "pages_with_images": len(pages_with_images_list),
        "pages_text_only": len(pages_without_images_list),
        "api_calls": len(pages_with_images_list),
        "estimated_cost": len(pages_with_images_list) * 0.03  # ~$0.03 per page with Claude
    }
    
    # If no pages have images, use Docling for everything (best structure, free)
    if not pages_with_images_list:
        logger.info(f"📝 No images detected. Using Docling for full document (structured, free)...")
        doc.close()
        markdown, _ = convert_pdf_with_docling_basic(pdf_path)
        markdown += f"\n\n---\n*Procesado: {page_count} páginas con Docling (gratis). Sin imágenes detectadas.*"
        return markdown, page_count, stats
    
    # Results dictionary to store content by page number
    page_results = {}
    
    # STEP 1: Process pages WITH images using Claude API (fast, parallel-ready)
    logger.info(f"🚀 Processing {len(pages_with_images_list)} pages with Claude API...")
    
    for page_num in pages_with_images_list:
        page = doc[page_num]
        logger.info(f"📄 [CLAUDE] Page {page_num + 1}/{page_count} (has images)...")
        
        # Render page to high-resolution image
        mat = fitz.Matrix(PAGE_RENDER_SCALE, PAGE_RENDER_SCALE)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        img_base64 = base64.b64encode(img_data).decode("utf-8")
        
        # Process with selected API
        if api == "claude":
            page_content = await process_page_with_claude(img_base64, page_num + 1)
        else:
            page_content = await process_page_with_openai(img_base64, page_num + 1)
        
        if page_content:
            page_results[page_num] = page_content
            logger.info(f"✅ Page {page_num + 1}: {len(page_content)} chars (Claude)")
        else:
            # Fallback to text extraction if API fails
            page_results[page_num] = doc[page_num].get_text("text").strip()
            logger.warning(f"⚠️ Page {page_num + 1}: API failed, used text fallback")
    
    # STEP 2: Process ALL pages WITHOUT images using Docling in ONE BATCH
    if pages_without_images_list:
        logger.info(f"📝 Processing {len(pages_without_images_list)} text-only pages with Docling (batch)...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create a single PDF with all text-only pages
            batch_pdf_path = temp_path / "text_pages_batch.pdf"
            batch_doc = fitz.open()
            
            # Map: position in batch -> original page number
            batch_to_original = {}
            for batch_idx, page_num in enumerate(pages_without_images_list):
                batch_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
                batch_to_original[batch_idx] = page_num
            
            batch_doc.save(str(batch_pdf_path))
            batch_doc.close()
            
            # Process batch PDF with Docling (ONE call instead of N calls)
            try:
                pipeline_options = PdfPipelineOptions()
                pipeline_options.do_table_structure = True
                pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
                
                converter = DocumentConverter(
                    format_options={
                        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                    }
                )
                
                logger.info(f"📄 Converting batch PDF with Docling ({len(pages_without_images_list)} pages)...")
                result = converter.convert(str(batch_pdf_path))
                batch_markdown = result.document.export_to_markdown()
                
                # Split by page breaks (Docling uses form feed or we estimate by content)
                # For now, assign full content to first text page, others get extracted text
                # This is a simplification - ideally we'd parse Docling's page structure
                
                # Apply structure improvements
                batch_markdown = improve_markdown_structure(batch_markdown, "batch")
                
                # Distribute content: for now, use full batch for all text pages combined
                # We'll split by approximate page markers or use as single block
                if len(pages_without_images_list) == 1:
                    page_results[pages_without_images_list[0]] = batch_markdown
                else:
                    # Split content roughly by page count
                    lines = batch_markdown.split('\n')
                    lines_per_page = max(1, len(lines) // len(pages_without_images_list))
                    
                    for i, page_num in enumerate(pages_without_images_list):
                        start = i * lines_per_page
                        end = start + lines_per_page if i < len(pages_without_images_list) - 1 else len(lines)
                        page_results[page_num] = '\n'.join(lines[start:end])
                
                logger.info(f"✅ Docling batch complete: {len(batch_markdown)} chars")
                
            except Exception as e:
                logger.warning(f"Docling batch failed: {e}, using PyMuPDF fallback")
                for page_num in pages_without_images_list:
                    page_results[page_num] = doc[page_num].get_text("text").strip()
    
    doc.close()
    
    # STEP 3: Combine results IN ORDER
    markdown_parts = [f"# {pdf_path.stem}\n"]
    
    for page_num in range(page_count):
        content = page_results.get(page_num, "")
        if content.strip():
            markdown_parts.append(f"\n---\n\n{content}")
    
    # Add stats footer
    markdown_parts.append(f"\n\n---\n*Procesado: {stats['pages_text_only']} páginas con Docling (gratis) + {stats['pages_with_images']} páginas con Claude API. Coste estimado: ${stats['estimated_cost']:.2f}*")
    
    result = "\n".join(markdown_parts)
    logger.info(f"✅ Hybrid conversion complete. API calls: {stats['api_calls']}, Est. cost: ${stats['estimated_cost']:.2f}")
    
    return result, page_count, stats


# =============================================================================
# DOCLING CONVERSION (for non-PDF formats)
# =============================================================================

def convert_with_docling(file_path: Path) -> str:
    """Convert document using Docling (for DOCX, PPTX, etc.)"""
    
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
    
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    
    result = converter.convert(str(file_path))
    return result.document.export_to_markdown()


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    api_status = get_available_api()
    
    return {
        "status": "healthy",
        "service": "docling",
        "version": "2.0.0",
        "api_configured": api_status is not None,
        "api_provider": api_status,
        "premium_available": api_status is not None,
    }


@app.get("/config")
async def get_config():
    """Get current configuration status"""
    return {
        "claude_configured": bool(CLAUDE_API_KEY),
        "openai_configured": bool(OPENAI_API_KEY),
        "active_provider": get_available_api(),
        "claude_model": CLAUDE_MODEL,
        "openai_model": OPENAI_MODEL,
        "page_render_scale": PAGE_RENDER_SCALE,
    }


@app.get("/formats")
async def supported_formats():
    """List supported file formats"""
    return {
        "formats": list(SUPPORTED_EXTENSIONS.keys()),
        "description": {
            ".pdf": "PDF documents (Basic: OCR, Premium: VLM for formulas/images)",
            ".docx": "Microsoft Word documents",
            ".pptx": "Microsoft PowerPoint presentations",
            ".xlsx": "Microsoft Excel spreadsheets",
            ".html/.htm": "HTML documents",
            ".png/.jpg/.jpeg/.tiff/.bmp": "Images (with OCR)",
            ".md": "Markdown files",
            ".asciidoc": "AsciiDoc files"
        },
        "note": "EPUB files are handled by the Node.js service, not this endpoint."
    }


@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Analyze a document and recommend processing mode.
    Returns analysis with recommendation and estimated cost.
    """
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext != '.pdf':
        return {
            "filename": file.filename,
            "format": file_ext,
            "recommended_mode": "basic",
            "reason": "Non-PDF formats use standard Docling conversion.",
            "estimated_cost_premium": 0,
        }
    
    # Save file temporarily
    temp_dir = tempfile.mkdtemp(prefix="e2kb_analyze_")
    input_path = Path(temp_dir) / file.filename
    
    try:
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        analysis = analyze_pdf(input_path)
        analysis["filename"] = file.filename
        analysis["api_available"] = get_available_api()
        
        return analysis
        
    finally:
        shutil.rmtree(temp_dir)


@app.post("/convert", response_model=ConversionResult)
async def convert_document(
    file: UploadFile = File(...),
    mode: ProcessingMode = Form(default=ProcessingMode.BASIC),
):
    """
    Convert a document to Markdown.
    
    - **file**: The document file to convert
    - **mode**: Processing mode (basic=free OCR, premium=VLM API)
    """
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {file_ext}. Supported: {list(SUPPORTED_EXTENSIONS.keys())}"
        )
    
    temp_dir = tempfile.mkdtemp(prefix="e2kb_docling_")
    input_path = Path(temp_dir) / file.filename
    
    try:
        # Save file
        logger.info(f"📥 Receiving: {file.filename} ({file_ext})")
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_size_mb = len(content) / (1024 * 1024)
        logger.info(f"📁 Saved: {file_size_mb:.2f} MB")
        logger.info(f"🔧 Processing mode: {mode.value}")
        
        start_time = time.time()
        markdown_content = None
        pages_processed = None
        estimated_cost = None
        
        # Process based on format and mode
        if file_ext == '.pdf':
            if mode == ProcessingMode.PREMIUM:
                api = get_available_api()
                if not api:
                    raise HTTPException(
                        status_code=400,
                        detail="Premium mode requires API key. Configure CLAUDE_API_KEY or OPENAI_API_KEY."
                    )
                
                markdown_content, pages_processed, stats = await convert_pdf_premium(input_path, api)
                estimated_cost = stats.get("estimated_cost", 0)
                logger.info(f"📊 Hybrid stats: {stats['pages_with_images']} premium pages, {stats['pages_text_only']} free pages")
                
            else:  # BASIC mode
                logger.info("📄 Using Docling structured extraction...")
                markdown_content, pages_processed = convert_pdf_with_docling_basic(input_path)
        else:
            # Non-PDF: use Docling
            logger.info(f"🔧 Using Docling for {file_ext}...")
            markdown_content = convert_with_docling(input_path)
        
        elapsed = time.time() - start_time
        word_count = count_words(markdown_content) if markdown_content else 0
        
        logger.info(f"✅ Conversion complete: {word_count} words in {elapsed:.2f}s")
        
        return ConversionResult(
            success=True,
            markdown=markdown_content,
            title=Path(file.filename).stem,
            word_count=word_count,
            processing_mode=mode.value,
            pages_processed=pages_processed,
            estimated_cost=estimated_cost,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Conversion error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return ConversionResult(
            success=False,
            error=str(e)
        )
    finally:
        shutil.rmtree(temp_dir)


@app.post("/convert-batch")
async def convert_batch(
    files: list[UploadFile] = File(...),
    mode: ProcessingMode = Form(default=ProcessingMode.BASIC),
):
    """Convert multiple documents"""
    results = []
    
    for file in files:
        result = await convert_document(file, mode)
        results.append({
            "filename": file.filename,
            "result": result
        })
    
    return {"results": results}
