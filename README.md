# E2KB Engine

<div align="center">

![E2KB Engine](https://img.shields.io/badge/E2KB-Engine-emerald?style=for-the-badge&logo=markdown&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Convierte EPUB, PDF, DOCX, PPTX y más en documentos Markdown perfectamente estructurados para sistemas RAG e Inteligencia Artificial**

[Demo en vivo](https://e2kb-engine.netlify.app) · [Reportar Bug](https://github.com/franjas1965/e2kb-engine/issues) · [Solicitar Feature](https://github.com/franjas1965/e2kb-engine/issues)

</div>

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

### Arquitectura Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│  ┌─────────────────┐      ┌─────────────────────────┐   │
│  │   e2kb-web      │      │   docling               │   │
│  │   (Next.js)     │◄────▶│   (FastAPI + Docling)   │   │
│  │   :3000         │      │   :8000                 │   │
│  └─────────────────┘      └─────────────────────────┘   │
│         │                           │                    │
│         │   EPUB → Motor Node.js    │                    │
│         │   PDF/DOCX → Docling ─────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Detener servicios

```bash
docker-compose down
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

## 📁 Estructura del Proyecto

```
e2kb-engine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── convert/
│   │   │       └── route.ts    # API de conversión
│   │   ├── page.tsx            # Interfaz principal
│   │   └── layout.tsx          # Layout de la app
│   └── lib/
│       └── epub-engine.ts      # Motor de conversión
├── Dockerfile                  # Configuración Docker
├── docker-compose.yml          # Orquestación Docker
├── netlify.toml               # Configuración Netlify
└── next.config.ts             # Configuración Next.js
```

---

## 🔧 Tecnologías

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **EPUB Parser:** adm-zip
- **Empaquetado:** Archiver

---

## 📊 Comparativa con Alternativas

| Característica | E2KB Engine | Calibre | Pandoc | Servicios SaaS |
|----------------|-------------|---------|--------|----------------|
| **Código abierto** | ✅ | ✅ | ✅ | ❌ |
| **Sin límites de uso** | ✅ | ✅ | ✅ | ❌ |
| **Interfaz web** | ✅ | ❌ | ❌ | ✅ |
| **API REST** | ✅ | ❌ | ❌ | ✅ |
| **Optimizado para RAG** | ✅ | ❌ | ❌ | ❌ |
| **TOC jerárquico** | ✅ | ❌ | ❌ | ❌ |
| **Metadatos preservados** | ✅ | Parcial | Parcial | Parcial |
| **Despliegue propio** | ✅ | ✅ | ✅ | ❌ |

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
