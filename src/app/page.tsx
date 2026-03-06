'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Download, Settings, CheckCircle, Loader2 } from 'lucide-react';

interface ConversionOptions {
  outputFormat: 'single' | 'multi' | 'optimized';
  extractImages: boolean;
  maxWords: number;
  maxFiles: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    outputFormat: 'multi',
    extractImages: false,
    maxWords: 400000,
    maxFiles: 50
  });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.epub')) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.epub')) {
      setFile(selectedFile);
      setResult(null);
    }
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    // Check file size limit (5MB for serverless functions)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setResult({
        success: false,
        message: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El límite es ${maxSizeMB} MB. Por favor, usa un EPUB más pequeño o contacta para soporte de archivos grandes.`
      });
      return;
    }

    setIsConverting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', options.outputFormat);
      formData.append('extractImages', String(options.extractImages));
      formData.append('maxWords', String(options.maxWords));
      formData.append('maxFiles', String(options.maxFiles));

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Conversion failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Response might not be JSON (e.g., "Request Entity Too Large")
          errorMessage = `Error del servidor (${response.status}). El archivo puede ser demasiado grande.`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `e2kb-${file.name.replace('.epub', '')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setResult({ success: true, message: 'Conversion completed successfully!' });
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
              accept=".epub"
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
                  </div>
                  <p className="text-emerald-400 text-sm">Click or drop to replace</p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-500" />
                  <div>
                    <p className="text-white font-medium text-lg">
                      Arrastra tu archivo EPUB aquí
                    </p>
                    <p className="text-slate-400 text-sm">
                      o haz click para seleccionar
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
    </div>
  );
}
