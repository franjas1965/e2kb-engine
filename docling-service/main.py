"""
E2KB Docling Service - FastAPI service for document conversion using Docling
Supports: PDF, DOCX, PPTX, XLSX, images (with OCR), HTML
Enhanced with VLM for formula/image description
"""

import os
import tempfile
import shutil
import time
import logging
import base64
import re
import httpx
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat

# Ollama configuration
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
VLM_MODEL = os.environ.get("VLM_MODEL", "llava:13b")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="E2KB Docling Service",
    description="Document conversion service using Docling",
    version="1.0.0"
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

class ConversionResult(BaseModel):
    success: bool
    markdown: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None
    word_count: Optional[int] = None


def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())


async def check_ollama_available() -> bool:
    """Check if Ollama service is available"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False


async def check_model_available(model: str) -> bool:
    """Check if a specific model is available in Ollama"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                return any(model in m for m in models)
            return False
    except Exception:
        return False


async def describe_image_with_vlm(image_path: Path, context: str = "") -> str:
    """
    Use VLM to describe an image (formula, table, diagram, etc.)
    Returns LaTeX for formulas or descriptive text for other images
    """
    try:
        # Read and encode image
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
        
        # Determine image type from extension
        ext = image_path.suffix.lower()
        mime_type = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }.get(ext, "image/png")
        
        # Create prompt for the VLM
        prompt = """Analiza esta imagen de un documento técnico español.

Si es una FÓRMULA MATEMÁTICA:
- Transcríbela en formato LaTeX entre $$ ... $$
- Añade una breve descripción de qué calcula

Si es una TABLA:
- Conviértela a formato Markdown
- Incluye todos los datos visibles

Si es un DIAGRAMA, PLANO o FIGURA:
- Describe detalladamente su contenido
- Menciona etiquetas, valores y relaciones visibles

Si es TEXTO:
- Transcríbelo fielmente

Contexto del documento: """ + (context if context else "Documento técnico normativo español")

        # Call Ollama API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": VLM_MODEL,
                    "prompt": prompt,
                    "images": [image_data],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 1024
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                logger.error(f"VLM error: {response.status_code} - {response.text}")
                return f"[Imagen no procesada: {image_path.name}]"
                
    except Exception as e:
        logger.error(f"Error describing image {image_path}: {e}")
        return f"[Error procesando imagen: {image_path.name}]"


def extract_images_from_document(result, output_dir: Path) -> List[Dict[str, Any]]:
    """
    Extract images from Docling conversion result
    Returns list of image info with paths and context
    """
    images = []
    
    try:
        # Docling stores pictures in the document
        if hasattr(result.document, 'pictures') and result.document.pictures:
            for idx, picture in enumerate(result.document.pictures):
                if hasattr(picture, 'image') and picture.image:
                    # Save image to file
                    img_filename = f"image_{idx:03d}.png"
                    img_path = output_dir / img_filename
                    
                    # Get image data
                    if hasattr(picture.image, 'pil_image'):
                        picture.image.pil_image.save(str(img_path))
                    elif hasattr(picture, 'get_image'):
                        img = picture.get_image(result.document)
                        if img:
                            img.save(str(img_path))
                    
                    if img_path.exists():
                        # Get context (surrounding text)
                        context = ""
                        if hasattr(picture, 'caption') and picture.caption:
                            context = picture.caption
                        
                        images.append({
                            "index": idx,
                            "path": img_path,
                            "filename": img_filename,
                            "context": context,
                            "page": getattr(picture, 'page_no', None)
                        })
                        logger.info(f"📷 Extracted image {idx}: {img_filename}")
        
        # Also check for figures
        if hasattr(result.document, 'figures') and result.document.figures:
            for idx, figure in enumerate(result.document.figures):
                if hasattr(figure, 'image') and figure.image:
                    img_filename = f"figure_{idx:03d}.png"
                    img_path = output_dir / img_filename
                    
                    if hasattr(figure.image, 'pil_image'):
                        figure.image.pil_image.save(str(img_path))
                    
                    if img_path.exists():
                        context = getattr(figure, 'caption', "") or ""
                        images.append({
                            "index": idx + 1000,  # Offset to avoid collision
                            "path": img_path,
                            "filename": img_filename,
                            "context": context,
                            "page": getattr(figure, 'page_no', None)
                        })
                        logger.info(f"📊 Extracted figure {idx}: {img_filename}")
                        
    except Exception as e:
        logger.error(f"Error extracting images: {e}")
    
    return images


async def enrich_markdown_with_vlm(markdown: str, images: List[Dict[str, Any]], doc_title: str) -> str:
    """
    Enrich markdown by replacing image placeholders with VLM descriptions
    """
    if not images:
        return markdown
    
    # Check if Ollama/VLM is available
    if not await check_ollama_available():
        logger.warning("⚠️ Ollama not available, skipping VLM enrichment")
        return markdown
    
    if not await check_model_available(VLM_MODEL):
        logger.warning(f"⚠️ Model {VLM_MODEL} not available, skipping VLM enrichment")
        return markdown
    
    logger.info(f"🤖 Processing {len(images)} images with VLM ({VLM_MODEL})...")
    
    enriched_parts = []
    
    for img_info in images:
        logger.info(f"🔍 Analyzing image {img_info['index']}: {img_info['filename']}")
        
        # Get VLM description
        description = await describe_image_with_vlm(
            img_info['path'],
            context=f"Documento: {doc_title}. {img_info.get('context', '')}"
        )
        
        if description:
            enriched_parts.append({
                "filename": img_info['filename'],
                "description": description,
                "page": img_info.get('page')
            })
            logger.info(f"✅ Image {img_info['index']} described ({len(description)} chars)")
    
    # Insert descriptions into markdown
    # Look for image references or empty sections that might be formulas
    enriched_markdown = markdown
    
    for part in enriched_parts:
        # Add description as a block after any reference to the image
        # or append at the end if no reference found
        img_ref = f"![{part['filename']}]"
        if img_ref in enriched_markdown:
            enriched_markdown = enriched_markdown.replace(
                img_ref,
                f"{img_ref}\n\n{part['description']}\n"
            )
    
    # Append any descriptions that weren't inserted
    if enriched_parts:
        enriched_markdown += "\n\n---\n## Contenido Visual Extraído\n\n"
        for part in enriched_parts:
            page_info = f" (Página {part['page']})" if part.get('page') else ""
            enriched_markdown += f"### {part['filename']}{page_info}\n\n{part['description']}\n\n"
    
    return enriched_markdown


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    ollama_available = await check_ollama_available()
    model_available = await check_model_available(VLM_MODEL) if ollama_available else False
    
    return {
        "status": "healthy", 
        "service": "docling",
        "vlm": {
            "ollama_url": OLLAMA_URL,
            "ollama_available": ollama_available,
            "model": VLM_MODEL,
            "model_available": model_available
        }
    }


@app.get("/vlm/status")
async def vlm_status():
    """Check VLM (Ollama) status and available models"""
    ollama_available = await check_ollama_available()
    
    if not ollama_available:
        return {
            "status": "unavailable",
            "ollama_url": OLLAMA_URL,
            "message": "Ollama service not reachable. VLM enrichment will be skipped."
        }
    
    # Get list of models
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                model_available = any(VLM_MODEL in m for m in models)
                
                return {
                    "status": "available",
                    "ollama_url": OLLAMA_URL,
                    "configured_model": VLM_MODEL,
                    "model_available": model_available,
                    "available_models": models,
                    "message": "Ready for VLM enrichment" if model_available else f"Model {VLM_MODEL} not found. Run: ollama pull {VLM_MODEL}"
                }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@app.get("/formats")
async def supported_formats():
    """List supported file formats"""
    return {
        "formats": list(SUPPORTED_EXTENSIONS.keys()),
        "description": {
            ".pdf": "PDF documents (native + OCR for scanned)",
            ".docx": "Microsoft Word documents",
            ".pptx": "Microsoft PowerPoint presentations",
            ".xlsx": "Microsoft Excel spreadsheets",
            ".html/.htm": "HTML documents",
            ".png/.jpg/.jpeg/.tiff/.bmp": "Images (with OCR)",
            ".md": "Markdown files",
            ".asciidoc": "AsciiDoc files"
        }
    }


@app.post("/convert", response_model=ConversionResult)
async def convert_document(
    file: UploadFile = File(...),
    extract_tables: bool = Form(default=True),
    enrich_images: bool = Form(default=True),
):
    """
    Convert a document to Markdown using Docling
    
    - **file**: The document file to convert
    - **extract_tables**: Whether to extract and format tables (default: True)
    - **enrich_images**: Whether to describe images/formulas with VLM (default: True)
    """
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Supported: {list(SUPPORTED_EXTENSIONS.keys())}"
        )
    
    # Create temp directory for processing
    temp_dir = tempfile.mkdtemp(prefix="e2kb_docling_")
    input_path = Path(temp_dir) / file.filename
    images_dir = Path(temp_dir) / "images"
    images_dir.mkdir(exist_ok=True)
    
    try:
        # Save uploaded file
        logger.info(f"📥 Receiving file: {file.filename} ({file_ext})")
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        file_size_mb = len(content) / (1024 * 1024)
        logger.info(f"📁 File saved: {file_size_mb:.2f} MB")
        
        # Initialize converter
        logger.info("🔧 Initializing Docling converter...")
        start_time = time.time()
        
        # Use default converter - Docling handles optimization internally
        converter = DocumentConverter()
        init_time = time.time() - start_time
        logger.info(f"✅ Converter initialized in {init_time:.2f}s")
        
        # Convert document
        logger.info(f"🔄 Converting document (this may take a while for large PDFs)...")
        convert_start = time.time()
        result = converter.convert(str(input_path))
        convert_time = time.time() - convert_start
        logger.info(f"✅ Document converted in {convert_time:.2f}s")
        
        # Export to markdown
        logger.info("📝 Exporting to Markdown...")
        markdown_content = result.document.export_to_markdown()
        
        # Extract title if available
        title = None
        if hasattr(result.document, 'title') and result.document.title:
            title = result.document.title
        elif hasattr(result.document, 'name') and result.document.name:
            title = result.document.name
        else:
            # Use filename without extension as fallback
            title = Path(file.filename).stem
        
        # Extract and process images with VLM if enabled
        if enrich_images:
            logger.info("🖼️ Extracting images from document...")
            images = extract_images_from_document(result, images_dir)
            
            if images:
                logger.info(f"📷 Found {len(images)} images, processing with VLM...")
                markdown_content = await enrich_markdown_with_vlm(
                    markdown_content, 
                    images, 
                    title or file.filename
                )
            else:
                logger.info("ℹ️ No images found in document")
        
        # Count words
        word_count = count_words(markdown_content)
        total_time = time.time() - start_time
        logger.info(f"🎉 Conversion complete! {word_count} words in {total_time:.2f}s")
        
        return ConversionResult(
            success=True,
            markdown=markdown_content,
            title=title,
            word_count=word_count
        )
        
    except Exception as e:
        logger.error(f"❌ Conversion error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return ConversionResult(
            success=False,
            error=str(e)
        )
    
    finally:
        # Cleanup temp directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@app.post("/convert-batch")
async def convert_batch(files: list[UploadFile] = File(...)):
    """
    Convert multiple documents to Markdown
    Returns a list of conversion results
    """
    results = []
    
    for file in files:
        result = await convert_document(file)
        results.append({
            "filename": file.filename,
            "result": result
        })
    
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
