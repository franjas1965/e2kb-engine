#!/usr/bin/env node

import { program } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { convertEPUB } from '../lib/epub-engine';

program
  .name('e2kb')
  .description('Convierte archivos EPUB a Markdown estructurado para RAG')
  .version('1.0.0');

program
  .command('convert <input>')
  .description('Convierte un archivo EPUB a Markdown')
  .option('-o, --output <dir>', 'Directorio de salida', './output')
  .option('-f, --format <type>', 'Formato: single o multi', 'single')
  .option('--no-images', 'No extraer imágenes')
  .action(async (input: string, options: { output: string; format: string; images: boolean }) => {
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
      
      console.log('📚 E2KB Engine - EPUB to Markdown');
      console.log('─'.repeat(40));
      console.log(`📄 Archivo: ${path.basename(inputPath)}`);
      console.log(`📁 Salida:  ${outputDir}`);
      console.log(`📋 Formato: ${options.format === 'single' ? 'Archivo único' : 'Multi-archivo'}`);
      console.log('─'.repeat(40));
      console.log('⏳ Procesando...\n');

      const result = await convertEPUB(inputPath, outputDir, {
        outputFormat: options.format as 'single' | 'multi',
        extractImages: options.images !== false,
        convertWikiLinks: true
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
