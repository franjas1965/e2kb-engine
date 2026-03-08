# E2KB Engine

<div align="center">

![E2KB Engine](https://img.shields.io/badge/E2KB-Engine-emerald?style=for-the-badge&logo=markdown&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-VLM-purple?style=for-the-badge&logo=ollama&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

### La solución open source definitiva para preparar documentos para IA

**Convierte EPUB, PDF, DOCX, PPTX, imágenes y más en Markdown perfectamente estructurado para sistemas RAG e Inteligencia Artificial**

**🧠 Con IA de Visión (VLM) local para transcribir fórmulas matemáticas a LaTeX**

[Demo EPUB](https://e2kb-engine.netlify.app) · [Documentación](#-tabla-de-contenidos) · [Reportar Bug](https://github.com/franjas1965/e2kb-engine/issues)

</div>

---

## 🌟 ¿Qué es E2KB Engine?

**E2KB Engine** es una plataforma **100% open source** que transforma cualquier documento en Markdown estructurado, optimizado para alimentar sistemas de Inteligencia Artificial.

### El problema que resolvemos

Las empresas y particulares que trabajan con **IA generativa** y sistemas **RAG** (Retrieval-Augmented Generation) enfrentan un problema crítico:

> *"Tengo miles de documentos PDF, pero mi IA no puede extraer información precisa de ellos."*

**¿Por qué?** Los PDFs son contenedores visuales, no semánticos. El texto se extrae desordenado, las tablas se rompen, las fórmulas desaparecen y los encabezados contaminan el contenido.

### La solución completa

E2KB Engine ofrece **tres niveles de funcionalidad** según tus necesidades:

| Nivel | Funcionalidad | Requisitos | Ideal para |
|-------|---------------|------------|------------|
| **🟢 Básico** | Conversión EPUB → Markdown | Node.js o Netlify/Vercel | Libros digitales, documentación estructurada |
| **🟡 Avanzado** | Multi-formato (PDF, DOCX, PPTX, imágenes) con OCR | Docker | Documentos empresariales, escaneados |
| **🔴 Completo** | Todo lo anterior + IA de Visión para fórmulas/diagramas | Docker + GPU NVIDIA | Documentos técnicos, científicos, ingeniería |

---

## 📋 Tabla de Contenidos

1. [Características completas](#-características-completas)
2. [Modos de despliegue](#-modos-de-despliegue)
3. [Instalación rápida](#-instalación-rápida)
4. [Formatos soportados](#-formatos-soportados)
5. [IA de Visión (VLM) para fórmulas](#-ia-de-visión-vlm-para-fórmulas)
6. [Sistema de notificaciones por email](#-sistema-de-notificaciones-por-email)
7. [CLI para automatización](#-cli-para-automatización)
8. [API Reference](#-api-reference)
9. [Arquitectura técnica](#-arquitectura-técnica)
10. [Comparativa con alternativas](#-comparativa-con-alternativas)
11. [Contribuir](#-contribuir)

---

## ✨ Características Completas

### Conversión de documentos

| Característica | Descripción |
|----------------|-------------|
| **Multi-formato** | EPUB, PDF, DOCX, PPTX, XLSX, HTML, imágenes |
| **OCR integrado** | Extrae texto de PDFs escaneados e imágenes |
| **Estructura preservada** | Capítulos, secciones, tablas, listas |
| **Metadatos** | Título, autor, fecha, identificadores |
| **Tabla de contenidos** | TOC jerárquico con enlaces funcionales |

### Inteligencia Artificial

| Característica | Descripción |
|----------------|-------------|
| **VLM local** | Modelos de visión ejecutándose en tu GPU |
| **Fórmulas → LaTeX** | Transcripción automática de ecuaciones |
| **Descripción de imágenes** | Diagramas y planos explicados en texto |
| **100% privado** | Ningún dato sale de tu servidor |

### Experiencia de usuario

| Característica | Descripción |
|----------------|-------------|
| **Interfaz web moderna** | Drag & drop, vista previa en tiempo real |
| **Procesamiento asíncrono** | Documentos grandes sin bloquear el navegador |
| **Notificaciones email** | Recibe el resultado cuando termine |
| **API REST** | Integración con cualquier sistema |
| **CLI** | Automatización y procesamiento masivo |

---

## 🚀 Modos de Despliegue

E2KB Engine se adapta a diferentes escenarios de uso:

### Comparativa de modos

| Modo | Formatos | OCR | VLM/Fórmulas | Requisitos | Coste |
|------|----------|-----|--------------|------------|-------|
| **Netlify/Vercel** | Solo EPUB | ❌ | ❌ | Cuenta gratuita | $0 |
| **Docker Básico** | EPUB + PDF + DOCX... | ✅ | ❌ | 4GB RAM, 2 CPU | $0 |
| **Docker + GPU** | Todos + fórmulas | ✅ | ✅ | 16GB RAM, GPU 8GB+ | $0 |
| **CLI local** | Solo EPUB | ❌ | ❌ | Node.js 18+ | $0 |

### 🟢 Modo 1: Demo en línea (solo EPUB)

**Ideal para:** Probar la herramienta, convertir EPUBs pequeños (<5MB)

```
https://e2kb-engine.netlify.app
https://e2kb-engine.vercel.app
```

**Limitaciones:**
- Solo archivos EPUB
- Máximo 5MB por archivo
- Sin OCR ni VLM

### 🟡 Modo 2: Docker sin GPU (multi-formato + OCR)

**Ideal para:** Empresas que necesitan convertir PDF, DOCX, PPTX con OCR

**Requisitos:**
- Docker Desktop
- 4GB RAM mínimo
- 10GB disco

```bash
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# Editar docker-compose.yml y comentar el servicio "ollama"
docker-compose up -d
```

**Incluye:**
- ✅ Conversión EPUB (motor nativo)
- ✅ Conversión PDF, DOCX, PPTX, XLSX, HTML, imágenes
- ✅ OCR para documentos escaneados
- ✅ Notificaciones por email
- ❌ Sin transcripción de fórmulas (requiere GPU)

### 🔴 Modo 3: Docker con GPU (funcionalidad completa)

**Ideal para:** Documentos técnicos con fórmulas, diagramas, planos

**Requisitos:**
- Docker Desktop con soporte GPU
- GPU NVIDIA con 8GB+ VRAM (RTX 3060, 3070, 3080, 4070...)
- 16GB RAM
- 50GB disco (modelos de IA)
- NVIDIA Container Toolkit instalado

```bash
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine
docker-compose up -d

# Descargar modelo de visión (primera vez, ~8GB)
docker exec e2kb-engine-ollama-1 ollama pull llava:13b
```

**Incluye todo lo anterior más:**
- ✅ Transcripción de fórmulas matemáticas a LaTeX
- ✅ Descripción de diagramas y planos
- ✅ Interpretación de tablas complejas
- ✅ Todo procesado localmente (privacidad total)

### 🔵 Modo 4: CLI (automatización)

**Ideal para:** Procesamiento masivo, pipelines CI/CD, scripts

```bash
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine
npm install && npm run build:cli && npm link

# Uso
e2kb convert documento.epub --format single
e2kb convert documento.epub --format optimized --max-files 50
```

**Nota:** El CLI solo soporta EPUB. Para otros formatos, usa la API Docker

---

## � Instalación Rápida

### Opción recomendada: Docker completo

```bash
# 1. Clonar repositorio
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. (Solo si tienes GPU) Descargar modelo de visión
docker exec e2kb-engine-ollama-1 ollama pull llava:13b

# 4. Abrir en el navegador
# http://localhost:3000
```

### Scripts de inicio rápido

```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh && ./start.sh
```

### Acceso

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Interfaz web principal |
| http://localhost:8000 | API Docling (conversión) |
| http://localhost:8000/vlm/status | Estado del VLM |
| http://[TU-IP]:3000 | Acceso desde otros PCs de la red |

---

## � Formatos Soportados

| Formato | Extensiones | Motor | OCR | VLM |
|---------|-------------|-------|-----|-----|
| **EPUB** | `.epub` | Node.js nativo | N/A | N/A |
| **PDF** | `.pdf` | Docling | ✅ | ✅ |
| **Word** | `.docx` | Docling | N/A | ✅ |
| **PowerPoint** | `.pptx` | Docling | N/A | ✅ |
| **Excel** | `.xlsx` | Docling | N/A | N/A |
| **HTML** | `.html`, `.htm` | Docling | N/A | N/A |
| **Imágenes** | `.png`, `.jpg`, `.jpeg` | Docling | ✅ | ✅ |
| **Markdown** | `.md` | Docling | N/A | N/A |

**Leyenda:**
- **OCR**: Reconocimiento óptico de caracteres para documentos escaneados
- **VLM**: Procesamiento con IA de Visión para fórmulas y diagramas

---

## 🧠 IA de Visión (VLM) para Fórmulas

### El problema de las fórmulas en PDFs

Cuando convertimos documentos técnicos (normativas, manuales de ingeniería, papers científicos), encontramos un problema crítico:

> **Las fórmulas matemáticas aparecen como imágenes en el PDF, no como texto.**

El OCR tradicional no puede interpretar estas imágenes. El resultado es un Markdown con "huecos":

```markdown
## 2.2 Cálculo del riesgo

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:
                        ← ¡Aquí debería estar la fórmula!
para el ruido ferroviario:
```

### La solución: Vision Language Models (VLM)

E2KB Engine integra **Ollama** con modelos de visión que se ejecutan **localmente en tu GPU**:

| Capacidad | Descripción |
|-----------|-------------|
| **Fórmulas → LaTeX** | Transcribe ecuaciones matemáticas a formato LaTeX |
| **Tablas → Markdown** | Convierte tablas complejas a formato GFM |
| **Diagramas → Texto** | Describe planos, esquemas y gráficos |
| **100% local** | Ningún dato sale de tu servidor |

### Resultado con VLM activado

```markdown
## 2.2 Cálculo del riesgo

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:

$$R_{A} = \frac{79.927 - 3.1162 \cdot L_{den} + 0.0342 \cdot L_{den}^2}{100}$$

> **Fórmula**: Riesgo absoluto para molestias por ruido vial, 
> donde $L_{den}$ es el nivel día-tarde-noche en dB.
```

### Requisitos de hardware para VLM

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **GPU NVIDIA** | 6GB VRAM | 12GB VRAM |
| **RAM Sistema** | 16GB | 32GB |
| **Disco** | 20GB | 50GB |

**GPUs compatibles:** RTX 3060 (12GB), RTX 3070, RTX 3080, RTX 4070, RTX 4080, RTX 4090, etc.

### Modelos VLM disponibles

| Modelo | VRAM | Velocidad | Calidad | Comando |
|--------|------|-----------|---------|---------|
| `llava:7b` | 4GB | Rápido | Buena | `ollama pull llava:7b` |
| `llava:13b` | 8GB | Medio | Muy buena | `ollama pull llava:13b` |
| `llava:34b` | 20GB | Lento | Excelente | `ollama pull llava:34b` |

### Configuración del VLM

```bash
# 1. Verificar que Ollama está corriendo
docker ps | grep ollama

# 2. Descargar modelo (primera vez)
docker exec e2kb-engine-ollama-1 ollama pull llava:13b

# 3. Verificar estado
curl http://localhost:8000/vlm/status
```

**Cambiar modelo** (editar `docker-compose.yml`):

```yaml
docling:
  environment:
    - VLM_MODEL=llava:7b  # Modelo más ligero
```

### Flujo de procesamiento

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PDF/DOCX   │────▶│  Docling    │────▶│  Detecta    │────▶│  Ollama     │
│  Original   │     │  OCR        │     │  Imágenes   │     │  VLM        │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                    ┌─────────────┐     ┌─────────────┐             │
                    │  Markdown   │◀────│  Enriquece  │◀────────────┘
                    │  Final      │     │  con LaTeX  │
                    └─────────────┘     └─────────────┘
```

---

## 📧 Sistema de Notificaciones por Email

Los documentos grandes (100+ páginas) con OCR y VLM pueden tardar **30+ minutos**. El sistema de email permite:

1. **Subir documento** → 2. **Introducir email** → 3. **Cerrar navegador** → 4. **Recibir email con resultado**

### Configuración

```bash
# Crear archivo .env en la raíz del proyecto
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx    # Contraseña de aplicación de Gmail
BASE_URL=http://localhost:3000
```

**Obtener contraseña de aplicación de Gmail:**
1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Genera una contraseña para "Correo"
3. Copia los 16 caracteres (sin espacios) a `SMTP_PASS`

---

## 💻 CLI para Automatización

El CLI permite procesar EPUBs desde la línea de comandos:

```bash
# Instalar CLI
npm install && npm run build:cli && npm link

# Convertir a un único archivo
e2kb convert documento.epub --format single

# Convertir a múltiples archivos (uno por capítulo)
e2kb convert documento.epub --format multi

# Optimizado para NotebookLM (máx 50 archivos)
e2kb convert documento.epub --format optimized --max-files 50 --max-words 50000
```

### Opciones del CLI

| Opción | Descripción | Default |
|--------|-------------|---------|
| `--output, -o` | Directorio de salida | `./output` |
| `--format, -f` | `single`, `multi`, `optimized` | `single` |
| `--max-words` | Palabras máx por archivo | `400000` |
| `--max-files` | Número máx de archivos | `50` |

**Nota:** El CLI solo soporta EPUB. Para PDF/DOCX usa la API Docker.

---

## 📡 API Reference

### Endpoints principales

#### Health Check
```http
GET /api/docling/health
```

Respuesta:
```json
{
  "status": "healthy",
  "service": "docling",
  "vlm": {
    "ollama_url": "http://ollama:11434",
    "ollama_available": true,
    "model": "llava:13b",
    "model_available": true
  }
}
```

#### Convertir documento
```http
POST /api/convert-docling
Content-Type: multipart/form-data

file: <archivo>
email: usuario@ejemplo.com (opcional)
```

Respuesta (conversión asíncrona):
```json
{
  "success": true,
  "jobId": "abc123-def456",
  "status": "processing",
  "message": "Conversión iniciada",
  "emailNotification": true
}
```

#### Estado de conversión
```http
GET /api/convert-docling/status?jobId=abc123-def456
```

Respuesta:
```json
{
  "jobId": "abc123-def456",
  "status": "completed",
  "progress": 100,
  "result": {
    "markdown": "# Contenido...",
    "wordCount": 45230
  }
}
```

#### Estado del VLM
```http
GET http://localhost:8000/vlm/status
```

Respuesta:
```json
{
  "status": "available",
  "ollama_url": "http://ollama:11434",
  "configured_model": "llava:13b",
  "model_available": true,
  "available_models": ["llava:13b"],
  "message": "Ready for VLM enrichment"
}
```

#### Formatos soportados
```http
GET http://localhost:8000/formats
```

Respuesta:
```json
{
  "formats": [".pdf", ".docx", ".pptx", ".xlsx", ".html", ".png", ".jpg", ".md"],
  "description": {
    ".pdf": "PDF documents (native + OCR for scanned)",
    ".docx": "Microsoft Word documents",
    ".pptx": "Microsoft PowerPoint presentations",
    ".xlsx": "Microsoft Excel spreadsheets"
  }
}
```

---

## 🏗️ Arquitectura Técnica

### Diagrama de servicios

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Docker Compose - E2KB Engine                        │
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐   │
│  │   e2kb-web      │    │   docling               │    │   ollama        │   │
│  │   (Next.js)     │◄──▶│   (FastAPI + Docling)   │◄──▶│   (VLM GPU)     │   │
│  │   :3000         │    │   :8000                 │    │   :11434        │   │
│  └────────┬────────┘    └─────────────────────────┘    └─────────────────┘   │
│           │                                                                   │
│  ┌────────▼────────┐                                                         │
│  │   redis         │    Cola de trabajos + Estado de conversiones            │
│  │   :6379         │                                                         │
│  └─────────────────┘                                                         │
│                                                                               │
│  Flujo: EPUB → Motor Node.js (nativo)                                        │
│         PDF/DOCX → Docling → OCR → VLM → Markdown enriquecido               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Servicios Docker

| Servicio | Puerto | Tecnología | Función |
|----------|--------|------------|---------|
| **e2kb-web** | 3000 | Next.js 15 | Frontend + API + Motor EPUB |
| **docling** | 8000 | FastAPI + Docling | Conversión PDF/DOCX + OCR |
| **ollama** | 11434 | Ollama | Modelos VLM (GPU) |
| **redis** | 6379 | Redis | Cola de trabajos |

### Estructura del proyecto

```
e2kb-engine/
├── src/                              # Frontend + API Next.js
│   ├── app/
│   │   ├── api/
│   │   │   ├── convert/              # API EPUB (nativo)
│   │   │   └── convert-docling/      # API multi-formato
│   │   └── page.tsx                  # Interfaz web
│   └── lib/
│       ├── epub-engine.ts            # Motor EPUB
│       ├── email.ts                  # Notificaciones
│       └── queue.ts                  # Cola Redis
├── docling-service/                  # Servicio Python
│   ├── main.py                       # FastAPI + Docling + VLM
│   └── Dockerfile
├── docker-compose.yml                # Orquestación
├── start.bat / start.sh              # Scripts de inicio
└── .env.example                      # Variables de entorno
```

### Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Next.js API Routes, FastAPI (Python) |
| **Conversión** | Motor EPUB nativo (Node.js), Docling (Python) |
| **OCR** | RapidOCR (integrado en Docling) |
| **IA** | Ollama, LLaVA (modelos de visión) |
| **Cola** | Redis |
| **Email** | Nodemailer (SMTP) |
| **Contenedores** | Docker, Docker Compose |

---

## 📊 Comparativa con Alternativas

| Característica | E2KB Engine | Calibre | Pandoc | Mathpix | Servicios SaaS |
|----------------|-------------|---------|--------|---------|----------------|
| **Código abierto** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Sin límites de uso** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Interfaz web** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **API REST** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Optimizado para RAG** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **OCR integrado** | ✅ | ❌ | ❌ | ✅ | Parcial |
| **Fórmulas → LaTeX** | ✅ (VLM) | ❌ | ❌ | ✅ | ❌ |
| **IA de Visión local** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Notificación email** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Multi-formato** | ✅ | ✅ | ✅ | ❌ | Parcial |
| **Despliegue propio** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **GPU local** | ✅ | N/A | N/A | N/A | N/A |

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Docling](https://github.com/DS4SD/docling) - Conversión de documentos
- [Ollama](https://ollama.ai/) - Servidor de modelos de IA
- [LLaVA](https://llava-vl.github.io/) - Modelo de visión
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Redis](https://redis.io/) - Base de datos en memoria
- [Lucide](https://lucide.dev/) - Iconos

---

## 📞 Soporte

- **Issues:** [github.com/franjas1965/e2kb-engine/issues](https://github.com/franjas1965/e2kb-engine/issues)
- **Discusiones:** [github.com/franjas1965/e2kb-engine/discussions](https://github.com/franjas1965/e2kb-engine/discussions)

---

<div align="center">

### ¿Te ha sido útil E2KB Engine?

⭐ **Dale una estrella en GitHub** ⭐

**E2KB Engine** es un proyecto open source mantenido por la comunidad.

[Ver en GitHub](https://github.com/franjas1965/e2kb-engine) · [Reportar Bug](https://github.com/franjas1965/e2kb-engine/issues) · [Solicitar Feature](https://github.com/franjas1965/e2kb-engine/issues)

</div>
