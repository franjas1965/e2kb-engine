'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Download, Settings, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

// Supported file formats
const EPUB_EXTENSIONS = ['.epub'];
const DOCLING_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx', '.html', '.htm', '.png', '.jpg', '.jpeg'];
const ALL_EXTENSIONS = [...EPUB_EXTENSIONS, ...DOCLING_EXTENSIONS];

function isValidFileType(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALL_EXTENSIONS.includes(ext);
}

function isEpubFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.epub');
}

function requiresDocling(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return DOCLING_EXTENSIONS.includes(ext);
}

async function checkDoclingAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/docling/health');
    return response.ok;
  } catch {
    return false;
  }
}

interface ConversionOptions {
  outputFormat: 'single' | 'multi' | 'optimized';
  extractImages: boolean;
  maxWords: number;
  maxFiles: number;
  processingMode: 'basic' | 'premium';
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    outputFormat: 'multi',
    extractImages: false,
    maxWords: 400000,
    maxFiles: 50,
    processingMode: 'basic'
  });
  const [premiumAvailable, setPremiumAvailable] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Check premium availability on mount
  const checkPremiumAvailable = useCallback(async () => {
    try {
      const response = await fetch('/api/docling/health');
      if (response.ok) {
        const data = await response.json();
        setPremiumAvailable(data.premium_available === true);
      }
    } catch {
      setPremiumAvailable(false);
    }
  }, []);

  // Check on file select if it's a PDF
  const handleFileWithPremiumCheck = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
      await checkPremiumAvailable();
    }
  }, [checkPremiumAvailable]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile.name)) {
      handleFileWithPremiumCheck(droppedFile);
    }
  }, [handleFileWithPremiumCheck]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile.name)) {
      handleFileWithPremiumCheck(selectedFile);
    }
  }, [handleFileWithPremiumCheck]);

  const handleConvert = async () => {
    if (!file) return;

    // Check if file requires Docling (PDF, DOCX, etc.) - only available in Docker deployment
    if (requiresDocling(file.name)) {
      // Check if Docling service is available
      try {
        const healthCheck = await fetch('/api/docling/health');
        if (!healthCheck.ok) {
          setResult({
            success: false,
            message: `Los archivos ${file.name.split('.').pop()?.toUpperCase()} solo están soportados en la versión Docker. Esta versión serverless solo soporta EPUB. Usa Docker Desktop o despliega en un VPS para convertir PDF, DOCX, PPTX y otros formatos.`
          });
          return;
        }
      } catch {
        setResult({
          success: false,
          message: `Los archivos ${file.name.split('.').pop()?.toUpperCase()} solo están soportados en la versión Docker. Esta versión serverless solo soporta EPUB. Usa Docker Desktop o despliega en un VPS para convertir PDF, DOCX, PPTX y otros formatos.`
        });
        return;
      }
    }

    // Check file size limit (5MB for serverless functions, no limit for Docker)
    // If Docling health check passed above, we're in Docker mode - skip size limit
    const isDockerMode = requiresDocling(file.name) || await checkDoclingAvailable();
    if (!isDockerMode) {
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setResult({
          success: false,
          message: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El límite es ${maxSizeMB} MB. Por favor, usa un archivo más pequeño o la versión Docker para archivos grandes.`
        });
        return;
      }
    }

    // For PDF files, show email modal first (unless already submitted)
    const useDocling = requiresDocling(file.name);
    if (useDocling && !emailSubmitted && !showEmailModal) {
      setShowEmailModal(true);
      return;
    }

    setIsConverting(true);
    setResult(null);
    setShowEmailModal(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', options.outputFormat);
      formData.append('extractImages', String(options.extractImages));
      formData.append('maxWords', String(options.maxWords));
      formData.append('maxFiles', String(options.maxFiles));
      
      // Add processing mode for PDF and EPUB files
      if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.epub')) {
        formData.append('mode', options.processingMode);
      }

      // Route to appropriate API based on file type
      const apiEndpoint = useDocling ? '/api/convert-docling' : '/api/convert';
      
      // Use async mode for Docling to avoid timeout issues
      if (useDocling) {
        formData.append('async', 'true');
        if (email) {
          formData.append('email', email);
        }
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Conversion failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Error del servidor (${response.status}). El archivo puede ser demasiado grande.`;
        }
        throw new Error(errorMessage);
      }

      // For async Docling conversions, poll for status or wait for email
      if (useDocling) {
        const data = await response.json();
        const { jobId, emailNotification } = data;
        
        // If email notification is enabled, show success and don't poll
        if (emailNotification && email) {
          setResult({ 
            success: true, 
            message: `✅ Conversión iniciada. Recibirás un email en ${email} cuando esté lista. Puedes cerrar esta página.` 
          });
          setEmailSubmitted(false);
          setEmail('');
          return;
        }
        
        setResult({ success: true, message: 'Procesando documento... Por favor espera.' });
        
        // Poll for completion
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes with 5 second intervals
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const statusResponse = await fetch(`/api/convert-docling/status?jobId=${jobId}`);
          
          if (!statusResponse.ok) {
            const error = await statusResponse.json();
            throw new Error(error.error || 'Error checking conversion status');
          }
          
          const contentType = statusResponse.headers.get('content-type');
          
          // If we get a ZIP file, download it
          if (contentType?.includes('application/zip')) {
            const blob = await statusResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `e2kb-${file.name.substring(0, file.name.lastIndexOf('.'))}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setResult({ success: true, message: '¡Conversión completada!' });
            return;
          }
          
          // Otherwise, check JSON status
          const status = await statusResponse.json();
          
          if (status.status === 'completed') {
            // Fetch the file again (status endpoint returns ZIP when completed)
            continue;
          } else if (status.status === 'error') {
            throw new Error(status.error || 'Conversion failed');
          } else {
            // Still processing, update progress message
            setResult({ success: true, message: `Procesando: ${status.progress || 'Por favor espera...'}` });
          }
          
          attempts++;
        }
        
        throw new Error('Timeout: La conversión tardó demasiado. Intenta con un archivo más pequeño.');
      }

      // Synchronous mode for EPUB files
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `e2kb-${file.name.substring(0, file.name.lastIndexOf('.'))}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setResult({ success: true, message: '¡Conversión completada!' });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Conversion failed'
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            E2KB <span className="text-emerald-400">Engine</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Convierte archivos EPUB legales y técnicos en documentos Markdown estructurados
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
              ${isDragging 
                ? 'border-emerald-400 bg-emerald-400/10' 
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }
              ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
            `}
          >
            <input
              type="file"
              accept=".epub,.pdf,.docx,.pptx,.xlsx,.html,.htm,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <FileText className="w-16 h-16 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium text-lg">{file.name}</p>
                    <p className="text-slate-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {requiresDocling(file.name) && (
                      <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Requiere versión Docker
                      </p>
                    )}
                  </div>
                  <p className="text-emerald-400 text-sm">Click o arrastra para reemplazar</p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-500" />
                  <div>
                    <p className="text-white font-medium text-lg">
                      Arrastra tu archivo aquí
                    </p>
                    <p className="text-slate-400 text-sm">
                      EPUB • PDF • DOCX • PPTX • XLSX • Imágenes
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-medium">Opciones de conversión</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Formato de salida</label>
                  <select
                    value={options.outputFormat}
                    onChange={(e) => setOptions({ ...options, outputFormat: e.target.value as 'single' | 'multi' | 'optimized' })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="single">Documento único</option>
                    <option value="multi">Por capítulos</option>
                    <option value="optimized">Establecer límites (NotebookLM)</option>
                  </select>
                </div>

                {options.outputFormat === 'optimized' && (
                  <>
                    <div>
                      <label className="text-slate-400 text-sm block mb-2">Máx. palabras por archivo</label>
                      <input
                        type="number"
                        value={options.maxWords}
                        onChange={(e) => setOptions({ ...options, maxWords: parseInt(e.target.value) || 400000 })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                        min="10000"
                        max="500000"
                        step="10000"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm block mb-2">Máx. archivos a generar</label>
                      <input
                        type="number"
                        value={options.maxFiles}
                        onChange={(e) => setOptions({ ...options, maxFiles: parseInt(e.target.value) || 50 })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                        min="1"
                        max="100"
                      />
                    </div>
                    <p className="text-emerald-400 text-xs">
                      Fusiona capítulos para generar el menor número de archivos respetando los límites.
                    </p>
                  </>
                )}

                {/* Processing Mode - show for PDF and EPUB files */}
                {file && (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.epub')) && (
                  <div className="pt-2 border-t border-slate-600/50">
                    <label className="text-slate-400 text-sm block mb-2">Modo de procesamiento</label>
                    <select
                      value={options.processingMode}
                      onChange={(e) => setOptions({ ...options, processingMode: e.target.value as 'basic' | 'premium' })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="basic">Básico (gratuito)</option>
                      <option value="premium">
                        Premium (Claude AI)
                      </option>
                    </select>
                    {options.processingMode === 'premium' && (
                      <p className="text-amber-400 text-xs mt-2">
                        ⚡ Procesa imágenes con Claude AI: extrae fórmulas LaTeX, tablas y diagramas. Coste estimado: ~$0.01/imagen
                      </p>
                    )}
                    {options.processingMode === 'basic' && (
                      <p className="text-slate-500 text-xs mt-2">
                        {file.name.toLowerCase().endsWith('.epub') 
                          ? 'Las imágenes se eliminan del documento.'
                          : 'Extracción de texto estructurado. Las fórmulas en imágenes no se procesan.'}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-slate-500 text-xs mt-2">
                  Las imágenes se eliminan automáticamente para optimizar el resultado para sistemas RAG.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
                <h3 className="text-white font-medium mb-3">Características</h3>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Conversión de tablas a GFM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Wiki-links [[archivo#id]]
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Limpieza de CSS/Fuentes
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-xl border ${
              result.success 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <p className={result.success ? 'text-emerald-400' : 'text-red-400'}>
                {result.message}
              </p>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!file || isConverting}
            className={`
              mt-6 w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium text-lg
              transition-all duration-300
              ${!file || isConverting
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              }
            `}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Convirtiendo...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Convertir a Markdown
              </>
            )}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Soporta EPUB legales y técnicos • Código Penal • CTE • Y más
        </p>
      </div>

      {/* Email Modal for PDF conversions */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-2">📧 Notificación por Email</h2>
            <p className="text-slate-400 mb-4">
              La conversión de documentos PDF puede tardar varios minutos. 
              Introduce tu email para recibir una notificación cuando esté lista, 
              o continúa sin email para esperar en esta página.
            </p>
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-email@ejemplo.com"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEmailSubmitted(true);
                  handleConvert();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-medium transition-all"
              >
                {email ? 'Convertir y notificar' : 'Convertir sin email'}
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmail('');
                }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
