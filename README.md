# E2KB Engine

<div align="center">

![E2KB Engine](https://img.shields.io/badge/E2KB-Engine-emerald?style=for-the-badge&logo=markdown&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-VLM-purple?style=for-the-badge&logo=ollama&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Convierte EPUB, PDF, DOCX, PPTX y más en documentos Markdown perfectamente estructurados para sistemas RAG e Inteligencia Artificial**

**🆕 Con IA de Visión (VLM) para transcribir fórmulas matemáticas, tablas e imágenes**

[Demo en vivo](https://e2kb-engine.netlify.app) · [Reportar Bug](https://github.com/franjas1965/e2kb-engine/issues) · [Solicitar Feature](https://github.com/franjas1965/e2kb-engine/issues)

</div>

---

## 📋 Tabla de Contenidos

- [El Problema que Resolvemos](#-el-problema-que-resolvemos)
- [La Solución: E2KB Engine](#-la-solución-e2kb-engine)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Instalación con Docker](#-instalación-con-docker)
- [Enriquecimiento con IA de Visión (VLM)](#-enriquecimiento-con-ia-de-visión-vlm)
- [Sistema de Notificaciones por Email](#-sistema-de-notificaciones-por-email)
- [Opciones de Despliegue](#-opciones-de-despliegue)
- [CLI (Línea de Comandos)](#-cli-línea-de-comandos)
- [API Reference](#-api-reference)
- [Desarrollo Local](#-desarrollo-local)
- [Contribuir](#-contribuir)

---

## 🎯 El Problema que Resolvemos

### La crisis silenciosa del RAG: documentos mal estructurados

Si trabajas con **Inteligencia Artificial** y sistemas **RAG (Retrieval-Augmented Generation)**, conoces este dolor:

> *"Mi IA tiene acceso a toda la documentación, pero las respuestas son imprecisas, incompletas o simplemente incorrectas."*

**El problema no es tu modelo de IA. Es la calidad de tus documentos.**

La mayoría de organizaciones alimentan sus sistemas RAG con PDFs. Y aquí está el secreto que pocos conocen:

### ❌ Por qué los PDFs son el enemigo silencioso del RAG

| Problema | Impacto en RAG |
|----------|----------------|
| **Layouts escaneados** | El texto se extrae desordenado, mezclando columnas y párrafos |
| **Tablas rotas** | Los datos tabulares se convierten en texto sin sentido |
| **Fórmulas perdidas** | Expresiones matemáticas se transforman en caracteres aleatorios |
| **Encabezados/pies** | Se mezclan con el contenido principal, contaminando el contexto |
| **Imágenes con texto** | OCR imperfecto genera ruido en los embeddings |

**Resultado:** Tu sistema RAG recupera fragmentos incorrectos, genera alucinaciones y pierde la confianza de los usuarios.

### ✅ Por qué EPUB es el formato ideal para RAG

| Ventaja | Beneficio para RAG |
|---------|-------------------|
| **Estructura semántica** | Capítulos, secciones y párrafos claramente definidos |
| **Metadatos ricos** | Título, autor, fecha, identificadores preservados |
| **Tabla de contenidos** | Navegación jerárquica que mejora la recuperación |
| **Texto limpio** | Sin artefactos de escaneo ni layouts complejos |
| **Estándar abierto** | Formato consistente y predecible |

**EPUB no es solo un formato de ebook. Es un contenedor XML estructurado, diseñado para preservar la semántica del documento.**

---

## 💡 La Solución: E2KB Engine

**E2KB Engine** (EPUB-to-Knowledge-Base) transforma archivos EPUB en Markdown perfectamente estructurado, listo para:

- 🤖 **Sistemas RAG** (LangChain, LlamaIndex, Haystack)
- 📚 **Bases de conocimiento** (Notion, Obsidian, Confluence)
- 🔍 **Búsqueda semántica** (Elasticsearch, Pinecone, Weaviate)
- 💬 **Chatbots documentales** (ChatGPT, Claude, Gemini)

### Características principales

- ✅ **Metadatos preservados** - Título, autor, fecha, identificador
- ✅ **TOC jerárquico** - Tabla de contenidos con enlaces funcionales
- ✅ **Párrafos separados** - Estructura óptima para chunking
- ✅ **Tablas GFM** - Conversión a GitHub Flavored Markdown
- ✅ **Imágenes extraídas** - Assets organizados en carpetas
- ✅ **Sin límites de uso** - Open source, despliega en tu servidor

---

## 🚀 Opciones de Despliegue

E2KB Engine ofrece **dos modalidades** según tus necesidades:

### Opción 1: Aplicación Web (Interfaz gráfica)

Ideal para usuarios no técnicos o uso ocasional.

#### Demo en línea (limitada)

- **Netlify:** https://e2kb-engine.netlify.app
- **Vercel:** https://e2kb-engine.vercel.app

> ⚠️ **Limitación importante:** Las plataformas serverless (Vercel, Netlify) tienen un límite de **~5MB** para archivos subidos. Para documentos más grandes, usa el despliegue en servidor propio.

#### Despliegue en servidor propio (Docker/Dokploy)

**Sin límites de tamaño de archivo.** Recomendado para uso profesional.

**Requisitos del servidor:**

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disco | 5 GB | 10 GB |
| Node.js | 18+ | 20+ |

**Pasos de despliegue:**

```bash
# 1. Clonar repositorio
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# 2. Construir y ejecutar con Docker
docker-compose up -d

# La aplicación estará disponible en http://localhost:3000
```

**Con Dokploy:**

1. Crear nuevo proyecto en Dokploy
2. Conectar repositorio: `https://github.com/franjas1965/e2kb-engine`
3. Configurar:
   - **Build Method:** Dockerfile
   - **Port:** 3000
   - **Memory:** 2GB
4. Desplegar

---

### Opción 2: CLI (Línea de comandos)

Ideal para automatización, pipelines CI/CD o procesamiento masivo.

```bash
# 1. Clonar e instalar
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine
npm install
npm run build:cli
npm link

# 2. Uso desde cualquier carpeta
e2kb convert documento.epub

# Documento único
e2kb convert documento.epub --format single

# Por capítulos
e2kb convert documento.epub --format multi

# Optimizado para NotebookLM (fusión inteligente)
e2kb convert documento.epub --format optimized --max-words 50000 --max-files 50
```

**Formatos de salida:**

| Formato | Descripción |
|---------|-------------|
| `single` | Un único archivo Markdown con todo el contenido |
| `multi` | Un archivo por capítulo |
| `optimized` | Fusión inteligente de capítulos respetando límites |

**Opciones disponibles:**

| Opción | Descripción | Default |
|--------|-------------|---------|
| `--output, -o` | Directorio de salida | `./output` |
| `--format, -f` | `single`, `multi` o `optimized` | `single` |
| `--max-words` | Palabras máximas por archivo (solo `optimized`) | `400000` |
| `--max-files` | Número máximo de archivos (solo `optimized`) | `50` |

**Ejemplo real con CTE (74 capítulos):**

```
📊 Optimized output: 16 files from 74 chapters
```

Con `--max-words 50000`, el CTE de 74 capítulos se reduce a **16 archivos**, ideal para NotebookLM (límite 50 fuentes).

**Nombres de archivo descriptivos:**

```
01_CTEC_Cap01-10_Datos_editoriales.md
02_CTEC_Cap11-17_Orden_TMA8512021_de_23_de_julio.md
...
```

> **Nota:** Las imágenes se eliminan automáticamente para optimizar el resultado para sistemas RAG.

---

## ⚠️ Limitaciones en Plataformas Serverless

### El problema de los archivos grandes

Las plataformas serverless como **Vercel** y **Netlify** imponen límites estrictos:

| Plataforma | Límite de payload | Timeout | Memoria |
|------------|-------------------|---------|---------|
| **Vercel (Free)** | 4.5 MB | 10s | 1 GB |
| **Vercel (Pro)** | 50 MB | 60s | 3 GB |
| **Netlify (Free)** | 6 MB | 10s | 1 GB |
| **Netlify (Pro)** | 20 MB | 26s | 3 GB |

**Síntomas cuando se excede el límite:**

```
Error: "Request Entity Too Large"
Error: "Unexpected token 'R', "Request En"... is not valid JSON"
```

### Soluciones

| Escenario | Solución recomendada |
|-----------|---------------------|
| EPUB < 5MB | Usar demo en línea (Netlify/Vercel) |
| EPUB > 5MB | Docker local o CLI |
| PDF, DOCX, PPTX | Docker local (requiere Docling) |
| Procesamiento masivo | CLI con scripts |

---

## 🐳 Docker: Soporte Multi-Formato (Recomendado)

La versión Docker incluye **Docling** para convertir múltiples formatos:

| Formato | Extensiones | Características |
|---------|-------------|-----------------|
| **EPUB** | `.epub` | Motor nativo Node.js |
| **PDF** | `.pdf` | OCR incluido para escaneados |
| **Word** | `.docx` | Preserva estructura |
| **PowerPoint** | `.pptx` | Extrae texto de slides |
| **Excel** | `.xlsx` | Convierte tablas |
| **Imágenes** | `.png`, `.jpg` | OCR automático |
| **HTML** | `.html`, `.htm` | Limpieza de tags |

### Instalación con Docker Desktop

```bash
# 1. Clonar repositorio
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# 2. Iniciar servicios (Windows)
start.bat

# 2. Iniciar servicios (Linux/Mac)
chmod +x start.sh
./start.sh

# O manualmente:
docker-compose up -d --build
```

### Acceso

- **Web UI:** http://localhost:3000
- **Desde otros PCs de la red:** http://[TU-IP]:3000
- **API Docling:** http://localhost:8000

### Arquitectura Docker Completa

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Docker Compose - E2KB Engine                        │
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐   │
│  │   e2kb-web      │    │   docling               │    │   ollama        │   │
│  │   (Next.js)     │◄──▶│   (FastAPI + Docling)   │◄──▶│   (VLM GPU)     │   │
│  │   :3000         │    │   :8000                 │    │   :11434        │   │
│  └────────┬────────┘    └─────────────────────────┘    └─────────────────┘   │
│           │                         │                           │             │
│           │                         │   Extrae imágenes         │             │
│           │                         │   de fórmulas/tablas      │             │
│           │                         │         │                 │             │
│           │                         │         └────────────────▶│             │
│           │                         │           Describe con    │             │
│           │                         │           IA de Visión    │             │
│           │                                                                   │
│  ┌────────▼────────┐                                                         │
│  │   redis         │    Cola de trabajos + Estado de conversiones            │
│  │   :6379         │                                                         │
│  └─────────────────┘                                                         │
│                                                                               │
│  Flujo: EPUB → Motor Node.js                                                 │
│         PDF/DOCX → Docling → OCR → VLM (fórmulas) → Markdown enriquecido    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **e2kb-web** | 3000 | Frontend Next.js + API de conversión |
| **docling** | 8000 | Motor de conversión Docling (PDF, DOCX, etc.) |
| **ollama** | 11434 | Servidor de modelos de IA (VLM para imágenes) |
| **redis** | 6379 | Cola de trabajos y almacenamiento de estado |

### Detener servicios

```bash
docker-compose down
```

---

## 🤖 Enriquecimiento con IA de Visión (VLM)

### ¿Por qué necesitamos VLM?

Cuando convertimos documentos técnicos (normativas, manuales de ingeniería, papers científicos), encontramos un problema crítico:

> **Las fórmulas matemáticas, tablas complejas y diagramas aparecen como imágenes en el PDF, no como texto.**

El OCR tradicional no puede interpretar estas imágenes. El resultado es un Markdown con "huecos" donde deberían estar las fórmulas:

```markdown
## 2.2 Molestias intensas (MI)

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:

para el ruido ferroviario:    ← ¡Falta la fórmula!

para el ruido de aeronaves:
```

### La solución: Vision Language Models (VLM)

E2KB Engine integra **Ollama** con modelos de visión (llava:13b) que pueden:

1. **Detectar** imágenes de fórmulas, tablas y diagramas
2. **Analizar** el contenido visual
3. **Transcribir** fórmulas a LaTeX
4. **Describir** tablas en formato Markdown
5. **Explicar** diagramas y planos en lenguaje natural

### Resultado con VLM

```markdown
## 2.2 Molestias intensas (MI)

Para calcular el RA, deberán utilizarse las siguientes relaciones:

para el ruido vial:

$$R_{A_{vial}} = (79.927\% - 3.1162 \cdot L_{den} + 0.0342 \cdot L_{den}^2) / 100$$

> **Fórmula 4**: Calcula el riesgo absoluto para molestias intensas por ruido vial, 
> donde $L_{den}$ es el nivel de ruido día-tarde-noche en decibelios.

para el ruido ferroviario:

$$R_{A_{ferr}} = (38.159\% - 2.46538 \cdot L_{den} + 0.0285 \cdot L_{den}^2) / 100$$
```

### Configuración del VLM

#### 1. Requisitos de hardware

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **GPU NVIDIA** | 6GB VRAM | 12GB VRAM |
| **RAM** | 16GB | 32GB |
| **Disco** | 20GB | 50GB |

#### 2. Modelos disponibles

| Modelo | VRAM | Velocidad | Calidad |
|--------|------|-----------|---------|
| `llava:7b` | 4GB | Rápido | Buena |
| `llava:13b` | 8GB | Medio | Muy buena |
| `llava:34b` | 20GB | Lento | Excelente |

#### 3. Descargar modelo

```bash
# El modelo se descarga automáticamente, pero puedes forzarlo:
docker exec e2kb-engine-ollama-1 ollama pull llava:13b

# Verificar modelos disponibles:
docker exec e2kb-engine-ollama-1 ollama list
```

#### 4. Cambiar modelo (opcional)

Edita `docker-compose.yml` y añade la variable de entorno:

```yaml
docling:
  environment:
    - VLM_MODEL=llava:34b  # Cambiar a modelo más potente
```

### Verificar estado del VLM

```bash
# Desde el navegador o curl:
curl http://localhost:8000/vlm/status

# Respuesta esperada:
{
  "status": "available",
  "ollama_url": "http://ollama:11434",
  "configured_model": "llava:13b",
  "model_available": true,
  "message": "Ready for VLM enrichment"
}
```

### ¿Cómo funciona internamente?

```
PDF con fórmulas
       │
       ▼
┌──────────────────┐
│  Docling OCR     │  Extrae texto + detecta imágenes
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Clasificador    │  ¿Es fórmula, tabla o diagrama?
└────────┬─────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
[Fórmula] [Tabla]    [Diagrama]
    │         │            │
    ▼         ▼            ▼
┌──────────────────────────────┐
│  Ollama VLM (llava:13b)      │
│  - Fórmulas → LaTeX          │
│  - Tablas → Markdown         │
│  - Diagramas → Descripción   │
└──────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Markdown        │  Texto + fórmulas + descripciones
│  Enriquecido     │
└──────────────────┘
```

---

## 📧 Sistema de Notificaciones por Email

### ¿Por qué notificaciones por email?

Los documentos grandes (100+ páginas) con OCR y VLM pueden tardar **30 minutos o más** en procesarse. En lugar de mantener el navegador abierto esperando:

1. **Subes el documento**
2. **Introduces tu email**
3. **Cierras el navegador** (el proceso continúa en segundo plano)
4. **Recibes un email** cuando termina con el enlace de descarga

### Configuración del email

#### 1. Crear archivo `.env`

```bash
# En la raíz del proyecto (C:/e2kb-engine/.env)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
BASE_URL=http://localhost:3000
```

#### 2. Obtener contraseña de aplicación de Gmail

> ⚠️ **No uses tu contraseña normal de Gmail.** Necesitas una "Contraseña de aplicación".

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Inicia sesión con tu cuenta de Google
3. Selecciona "Correo" y "Ordenador Windows"
4. Haz clic en "Generar"
5. Copia la contraseña de 16 caracteres (sin espacios)
6. Pégala en `SMTP_PASS` del archivo `.env`

#### 3. Reiniciar servicios

```bash
docker-compose up -d
```

### Flujo de usuario

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Subir PDF      │────▶│  Modal: Email   │────▶│  Conversión     │
│  (Web UI)       │     │  (opcional)     │     │  en background  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┘
                        │
                        ▼
┌─────────────────┐     ┌─────────────────┐
│  Email con      │◀────│  Conversión     │
│  link descarga  │     │  completada     │
└─────────────────┘     └─────────────────┘
```

### Ejemplo de email recibido

```
De: E2KB Engine <tu-email@gmail.com>
Asunto: ✅ Conversión completada: documento.pdf

¡Tu documento ha sido convertido exitosamente!

📄 Archivo: documento.pdf
⏱️ Tiempo: 15 minutos 32 segundos
📝 Palabras: 45,230

🔗 Descargar resultado:
http://localhost:3000/api/convert-docling/download/abc123

Este enlace expira en 24 horas.
```

---

## 🛠️ Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/franjas1965/e2kb-engine.git
cd e2kb-engine

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Construir para producción |
| `npm run start` | Ejecutar build de producción |
| `npm run lint` | Verificar código |

---

## � API Reference

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

## � Estructura del Proyecto

```
e2kb-engine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── convert/
│   │   │   │   └── route.ts          # API conversión EPUB
│   │   │   └── convert-docling/
│   │   │       ├── route.ts          # API conversión multi-formato
│   │   │       └── status/
│   │   │           └── route.ts      # Estado de conversiones
│   │   ├── page.tsx                  # Interfaz principal
│   │   └── layout.tsx                # Layout de la app
│   └── lib/
│       ├── epub-engine.ts            # Motor EPUB nativo
│       ├── email.ts                  # Servicio de notificaciones
│       └── queue.ts                  # Cola de trabajos (Redis)
├── docling-service/
│   ├── main.py                       # API FastAPI + Docling + VLM
│   ├── Dockerfile                    # Imagen Docling
│   └── requirements.txt              # Dependencias Python
├── docker-compose.yml                # Orquestación (4 servicios)
├── Dockerfile                        # Imagen Next.js
├── .env.example                      # Variables de entorno
└── README.md                         # Esta documentación
```

---

## 🔧 Tecnologías

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React

### Backend
- **API:** Next.js API Routes + FastAPI (Python)
- **Conversión EPUB:** adm-zip (Node.js nativo)
- **Conversión PDF/DOCX:** Docling (Python)
- **OCR:** RapidOCR (incluido en Docling)
- **Cola de trabajos:** Redis
- **Email:** Nodemailer (SMTP)

### IA / Machine Learning
- **Servidor de modelos:** Ollama
- **Modelo de visión:** LLaVA 13B (o compatible)
- **Uso:** Transcripción de fórmulas, descripción de imágenes

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Orquestación:** 4 servicios (web, docling, ollama, redis)

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
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Iconos
- [adm-zip](https://github.com/cthackers/adm-zip) - Parser ZIP

---

<div align="center">

**¿Te ha sido útil E2KB Engine?**

⭐ Dale una estrella en GitHub ⭐

[Reportar un problema](https://github.com/franjas1965/e2kb-engine/issues) · [Solicitar una funcionalidad](https://github.com/franjas1965/e2kb-engine/issues)

</div>
