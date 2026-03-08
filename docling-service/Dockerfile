FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Docling (OCR, PDF processing, OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpoppler-cpp-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-spa \
    tesseract-ocr-eng \
    libmagic1 \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Pre-download ML models during build to avoid runtime downloads
# This includes Docling layout models and RapidOCR models
RUN python -c "from docling.document_converter import DocumentConverter; print('Downloading Docling models...'); converter = DocumentConverter(); print('Docling models downloaded successfully')"

# Pre-download RapidOCR models (torch engine)
RUN mkdir -p /usr/local/lib/python3.11/site-packages/rapidocr/models && \
    curl -L -o /usr/local/lib/python3.11/site-packages/rapidocr/models/ch_PP-OCRv4_det_infer.pth \
    "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.7.0/torch/PP-OCRv4/det/ch_PP-OCRv4_det_infer.pth" && \
    curl -L -o /usr/local/lib/python3.11/site-packages/rapidocr/models/ch_ptocr_mobile_v2.0_cls_infer.pth \
    "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.7.0/torch/PP-OCRv4/cls/ch_ptocr_mobile_v2.0_cls_infer.pth" && \
    curl -L -o /usr/local/lib/python3.11/site-packages/rapidocr/models/ch_PP-OCRv4_rec_infer.pth \
    "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.7.0/torch/PP-OCRv4/rec/ch_PP-OCRv4_rec_infer.pth" && \
    echo "RapidOCR models downloaded successfully"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
