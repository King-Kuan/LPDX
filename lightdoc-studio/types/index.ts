export type DocumentFormat = 'lpdx' | 'pdf' | 'docx';
export type CompressionMode = 'balanced' | 'aggressive' | 'quality';
export type PageSize = 'A4' | 'Letter' | 'A3' | 'Legal';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface DocumentMetadata {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  organization: string;
  createdAt: number;
  updatedAt: number;
  pageSize: PageSize;
  tags: string[];
}

export interface DocumentBlock {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'table' | 'image' | 'divider' | 'list';
  content: string;
  align?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  imageData?: string;
  imageCaption?: string;
  tableData?: string[][];
  listItems?: string[];
}

export interface LightDocument {
  meta: DocumentMetadata;
  blocks: DocumentBlock[];
  compressionMode: CompressionMode;
  imageQuality: number;
  enableOCR: boolean;
  embedFonts: boolean;
  pdfArchival: boolean;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  ocrSaving: number;
  imageSaving: number;
  streamSaving: number;
  fontSaving: number;
}

export interface ScanResult {
  text: string;
  confidence: number;
  imageData: string;
  processedAt: number;
}

export interface CachedDocument {
  doc: LightDocument;
  stats: CompressionStats | null;
  thumbnail?: string;
  size: number;
}
