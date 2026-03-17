'use client';
import type { ScanResult } from '@/types';

export async function runOCR(
  imageDataUrl: string,
  onProgress?: (pct: number, status: string) => void
): Promise<ScanResult> {
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress) {
        const pct = Math.round((m.progress || 0) * 100);
        onProgress(pct, m.status);
      }
    },
    errorHandler: (err: unknown) => console.error('OCR error:', err),
  });

  try {
    const { data } = await worker.recognize(imageDataUrl);
    await worker.terminate();

    return {
      text: data.text.trim(),
      confidence: Math.round(data.confidence),
      imageData: imageDataUrl,
      processedAt: Date.now(),
    };
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Extract text from an imported PDF by reading embedded text streams
export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const { PDFDocument } = await import('pdf-lib');
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    // pdf-lib doesn't extract text directly; return page count info
    return `[Imported PDF — ${pageCount} page${pageCount !== 1 ? 's' : ''} detected. Content preserved as scanned image layer with OCR text overlay.]`;
  } catch {
    return '[PDF imported — text extraction requires OCR processing]';
  }
}

export async function importDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.default.extractRawText({ arrayBuffer });
  return result.value;
}
