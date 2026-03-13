# E2KB Engine

<div align="center">

![E2KB Engine](https://img.shields.io/badge/E2KB-Engine-emerald?style=for-the-badge&logo=markdown&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-AI-purple?style=for-the-badge&logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

### Plataforma profesional para preparar documentos para IA

**Convierte EPUB, PDF, DOCX, PPTX, imágenes y más en Markdown perfectamente estructurado para sistemas RAG e Inteligencia Artificial**

**🧠 Con IA de Visión (Claude/OpenAI API) para transcribir fórmulas matemáticas a LaTeX**

[Demo EPUB](https://e2kb-engine.netlify.app) · [Documentación](#-tabla-de-contenidos) · [Solicitar Licencia](#-licencia)

</div>

---

## ⚠️ AVISO LEGAL IMPORTANTE

**Este software es propiedad exclusiva de Francisco Javier Sánchez (franjas1965).**

La utilización, copia, modificación, distribución o cualquier otra explotación de este software **requiere autorización previa y por escrito del propietario**.

Para solicitar autorización, contactar a: **franjas1@gmail.com**

Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 🌟 ¿Qué es E2KB Engine?

**E2KB Engine** es una plataforma profesional que transforma cualquier documento en Markdown estructurado, optimizado para alimentar sistemas de Inteligencia Artificial.

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
| **🔴 Premium** | Todo lo anterior + IA de Visión (Claude) para fórmulas | Docker + API Key Claude | Documentos técnicos, científicos, ingeniería |

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
| **Docker + Claude** | Todos + fórmulas | ✅ | ✅ | 4GB RAM + API Key | ~$0.03/página |
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

### 🔴 Modo 3: Docker con Claude/OpenAI API (funcionalidad completa)

**Ideal para:** Documentos técnicos con fórmulas, diagramas, planos

**Requisitos:**
- Docker Desktop
- 4GB RAM mínimo
- API Key de Claude (Anthropic) u OpenAI

```bash
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# 1. Copiar archivo de configuración
cp .env.example .env

# 2. Editar .env con tu API Key (elige UNA opción):
#    - CLAUDE_API_KEY=sk-ant-api03-...  (recomendado)
#    - OPENAI_API_KEY=sk-...

# 3. Iniciar servicios
docker-compose up -d
```

**Configuración de API Keys:**

| Proveedor | Variable | Modelo por defecto | Obtener Key |
|-----------|----------|-------------------|-------------|
| **Claude** | `CLAUDE_API_KEY` | `claude-sonnet-4-20250514` | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o` | [platform.openai.com](https://platform.openai.com) |

**Incluye todo lo anterior más:**
- ✅ Transcripción de fórmulas matemáticas a LaTeX
- ✅ Descripción de diagramas y planos
- ✅ Interpretación de tablas complejas
- ✅ Modelo Claude Sonnet (alta calidad)
- 💰 Coste: ~$0.03 por página

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

## 🔧 Instalación Rápida

### Opción recomendada: Docker completo

```bash
# 1. Clonar repositorio
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección de configuración)

# 3. Iniciar todos los servicios
docker-compose up -d

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

### Archivo .env.example

El archivo `.env.example` contiene todas las variables configurables:

```bash
# Email para notificaciones
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Contraseña de aplicación Gmail

# URL base para enlaces de descarga
BASE_URL=http://localhost:3000

# API Key para modo Premium (elegir UNA)
CLAUDE_API_KEY=                 # Recomendado: https://console.anthropic.com
CLAUDE_MODEL=claude-sonnet-4-20250514

OPENAI_API_KEY=                 # Alternativa: https://platform.openai.com
OPENAI_MODEL=gpt-4o
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
- **VLM**: Procesamiento con IA de Visión para fórmulas y diagramas (modo Premium)

---

## 🧠 Modo Premium: IA de Visión para Fórmulas

### El problema de las fórmulas en PDFs

Cuando convertimos documentos técnicos (normativas, manuales de ingeniería, papers científicos), encontramos un problema crítico:

> **Las fórmulas matemáticas aparecen como imágenes en el PDF, no como texto.**

El OCR tradicional no puede interpretar estas imágenes. El resultado es un Markdown con "huecos":

```markdown
## 2.2 Cálculo del riesgo

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:
*[imagen - usar modo Premium]*
para el ruido ferroviario:
```

### La solución: Claude API (Modo Premium)

E2KB Engine integra **Claude Sonnet** de Anthropic para procesar imágenes con fórmulas:

| Capacidad | Descripción |
|-----------|-------------|
| **Fórmulas → LaTeX** | Transcribe ecuaciones matemáticas a formato LaTeX válido |
| **Estructura jerárquica** | Detecta títulos, secciones y subsecciones |
| **Tablas → Markdown** | Convierte tablas complejas a formato GFM |
| **Alta precisión** | Modelo Claude Sonnet 4 de última generación |

### Resultado con modo Premium

```markdown
## 2.2 Cálculo del riesgo

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:

$$
RA_{MI,vial} = \frac{(78.9270 - 3.1162 \cdot L_{den} + 0.0342 \cdot L_{den}^2)}{100}
$$

> **(Fórmula 4)**
```

### Configuración del modo Premium

1. **Obtener API Key de Claude:**
   - Regístrate en [console.anthropic.com](https://console.anthropic.com)
   - Genera una API Key

2. **Configurar en docker-compose.yml:**

```yaml
docling:
  environment:
    - CLAUDE_API_KEY=sk-ant-api03-...
    - CLAUDE_MODEL=claude-sonnet-4-20250514
```

3. **Reiniciar el servicio:**

```bash
docker-compose up -d docling
```

### Costes estimados

| Modelo | Coste por página | Calidad | Recomendado |
|--------|------------------|---------|-------------|
| `claude-3-haiku` | ~$0.01 | Buena | Documentos simples |
| `claude-sonnet-4` | ~$0.03 | Excelente | **Documentos técnicos** |

### Flujo de procesamiento Premium

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PDF        │────▶│  Renderiza  │────▶│  Claude     │────▶│  Markdown   │
│  Original   │     │  a imagen   │     │  Sonnet API │     │  con LaTeX  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
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

## 📄 Licencia

**LICENCIA PROPIETARIA - TODOS LOS DERECHOS RESERVADOS**

Copyright (c) 2024-2026 Francisco Javier Sánchez (franjas1965)

Este software es propiedad exclusiva del autor. **Queda prohibido**:

- ❌ Usar este software sin autorización
- ❌ Copiar, modificar o distribuir el código
- ❌ Incorporar este software en otros proyectos
- ❌ Uso comercial sin licencia

**Para solicitar autorización de uso:**

📧 **Email:** franjas1@gmail.com

Incluir en la solicitud:
- Nombre o razón social
- Uso previsto (personal/comercial)
- Duración del uso

Ver archivo [LICENSE](LICENSE) para términos completos.

---

## 🙏 Tecnologías utilizadas

- [Next.js](https://nextjs.org/) - Framework React
- [Docling](https://github.com/DS4SD/docling) - Conversión de documentos
- [Claude API](https://anthropic.com/) - IA de visión para fórmulas
- [OpenAI API](https://openai.com/) - IA alternativa
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Redis](https://redis.io/) - Persistencia de trabajos
- [Docker](https://docker.com/) - Contenedores

---

## 📞 Contacto

**Propietario:** Francisco Javier Sánchez

📧 **Email:** franjas1@gmail.com

Para consultas sobre:
- Solicitud de licencia de uso
- Licencias comerciales
- Soporte técnico

---

<div align="center">

**E2KB Engine** © 2024-2026 Francisco Javier Sánchez

Todos los derechos reservados.

</div>
