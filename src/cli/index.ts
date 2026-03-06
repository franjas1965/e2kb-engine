#!/usr/bin/env node

import { program } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { convertEPUB } from '../lib/epub-engine';

interface ConvertOptions {
  output: string;
  format: 'single' | 'multi' | 'optimized';
  maxWords?: string;
  maxFiles?: string;
}

program
  .name('e2kb')
  .description('Convierte archivos EPUB a Markdown estructurado para RAG')
  .version('1.0.0');

program
  .command('convert <input>')
  .description('Convierte un archivo EPUB a Markdown')
  .option('-o, --output <dir>', 'Directorio de salida', './output')
  .option('-f, --format <type>', 'Formato: single, multi, optimized', 'single')
  .option('--max-words <number>', 'Palabras máximas por archivo (solo formato optimized)', '400000')
  .option('--max-files <number>', 'Número máximo de archivos (solo formato optimized)', '50')
  .action(async (input: string, options: ConvertOptions) => {
    try {
      const inputPath = path.resolve(input);
      
      if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: El archivo "${input}" no existe`);
        process.exit(1);
      }

      if (!inputPath.toLowerCase().endsWith('.epub')) {
        console.error('❌ Error: Solo se admiten archivos EPUB');
        process.exit(1);
      }

      const outputDir = path.resolve(options.output);
      const format = options.format as 'single' | 'multi' | 'optimized';
      
      // Format display names
      const formatNames: Record<string, string> = {
        'single': 'Documento único',
        'multi': 'Por capítulos',
        'optimized': 'Optimizado (fusión inteligente)'
      };
      
      console.log('📚 E2KB Engine - EPUB to Markdown');
      console.log('─'.repeat(40));
      console.log(`📄 Archivo: ${path.basename(inputPath)}`);
      console.log(`📁 Salida:  ${outputDir}`);
      console.log(`📋 Formato: ${formatNames[format]}`);
      
      if (format === 'optimized') {
        console.log(`📏 Máx. palabras/archivo: ${options.maxWords}`);
        console.log(`📂 Máx. archivos: ${options.maxFiles}`);
      }
      
      console.log('─'.repeat(40));
      console.log('⏳ Procesando...\n');

      const result = await convertEPUB(inputPath, outputDir, {
        outputFormat: format,
        extractImages: false,
        convertWikiLinks: true,
        maxWords: parseInt(options.maxWords || '400000', 10),
        maxFiles: parseInt(options.maxFiles || '50', 10)
      });

      console.log('✅ Conversión completada');
      console.log(`📦 Archivo generado: ${result.outputPath}`);
      console.log(`📊 Capítulos procesados: ${result.chapters}`);
      
    } catch (error) {
      console.error('❌ Error durante la conversión:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
