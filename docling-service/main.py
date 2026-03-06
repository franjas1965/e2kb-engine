"""
E2KB Docling Service - FastAPI service for document conversion using Docling
Supports: PDF, DOCX, PPTX, XLSX, images (with OCR), HTML
"""

import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "docling"}


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
    extract_images: bool = Form(default=False),
):
    """
    Convert a document to Markdown using Docling
    
    - **file**: The document file to convert
    - **extract_tables**: Whether to extract and format tables (default: True)
    - **extract_images**: Whether to include image references (default: False)
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
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Initialize converter
        converter = DocumentConverter()
        
        # Convert document
        result = converter.convert(str(input_path))
        
        # Export to markdown
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
        
        # Count words
        word_count = count_words(markdown_content)
        
        return ConversionResult(
            success=True,
            markdown=markdown_content,
            title=title,
            word_count=word_count
        )
        
    except Exception as e:
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
