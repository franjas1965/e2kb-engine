#!/bin/bash
echo "========================================"
echo "  E2KB Engine - Multi-Format Converter"
echo "========================================"
echo ""
echo "Starting Docker containers..."
echo ""

docker-compose up -d --build

echo ""
echo "========================================"
echo "  Services started!"
echo "========================================"
echo ""
echo "  Web UI:      http://localhost:3000"
echo "  Docling API: http://localhost:8000"
echo ""
echo "  Access from other devices on your network:"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "  To stop: docker-compose down"
echo "========================================"
