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

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim() || '[No text found — PDF may be scanned. Try the Scan tab for OCR.]';
}

export async function importDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.default.extractRawText({ arrayBuffer });
  return result.value;
}
