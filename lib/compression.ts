import type { LightDocument, CompressionStats, CompressionMode } from '@/types';

// Compression profiles for each mode
const PROFILES: Record<CompressionMode, { imageQuality: number; ocrWeight: number; streamOptimize: boolean }> = {
  balanced:   { imageQuality: 75, ocrWeight: 0.62, streamOptimize: true },
  aggressive: { imageQuality: 45, ocrWeight: 0.72, streamOptimize: true },
  quality:    { imageQuality: 90, ocrWeight: 0.55, streamOptimize: false },
};

export function estimateCompression(doc: LightDocument, originalSizeBytes: number): CompressionStats {
  const profile = PROFILES[doc.compressionMode];
  const q = doc.imageQuality / 100;

  // OCR text layer replaces raster — biggest saving
  const ocrSaving = doc.enableOCR ? profile.ocrWeight : 0;

  // Image compression saving based on quality setting
  const imageSaving = 0.18 * (1 - q);

  // PDF stream optimization
  const streamSaving = profile.streamOptimize ? 0.06 : 0.02;

  // Font subsetting
  const fontSaving = doc.embedFonts ? 0.04 : 0;

  const totalReduction = Math.min(ocrSaving + imageSaving + streamSaving + fontSaving, 0.88);
  const compressedSize = Math.round(originalSizeBytes * (1 - totalReduction));

  return {
    originalSize: originalSizeBytes,
    compressedSize,
    reductionPercent: Math.round(totalReduction * 100),
    ocrSaving: Math.round(ocrSaving * 100),
    imageSaving: Math.round(imageSaving * 100),
    streamSaving: Math.round(streamSaving * 100),
    fontSaving: Math.round(fontSaving * 100),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function compressImageToAvif(
  imageDataUrl: string,
  quality: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Try AVIF first, fall back to WebP, then JPEG
      const formats = ['image/avif', 'image/webp', 'image/jpeg'];
      let compressed = imageDataUrl;
      for (const fmt of formats) {
        try {
          const result = canvas.toDataURL(fmt, quality / 100);
          if (result !== 'data:,') {
            compressed = result;
            break;
          }
        } catch {
          continue;
        }
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

// Calculate estimated document size based on content
export function estimateDocumentSize(doc: LightDocument): number {
  let size = 512; // base PDF overhead in bytes
  for (const block of doc.blocks) {
    if (block.type === 'image' && block.imageData) {
      // Base64 image size
      size += Math.round((block.imageData.length * 3) / 4);
    } else {
      size += new TextEncoder().encode(block.content).length * 8; // text expansion in uncompressed PDF
    }
  }
  return Math.max(size, 1024 * 50); // minimum 50KB for demo realism
}
