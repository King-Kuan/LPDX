'use client';
import type { LightDocument, DocumentFormat } from '@/types';
import { estimateDocumentSize } from './compression';

// Dynamically import pdf-lib to avoid SSR issues
async function getPdfLib() {
  const { PDFDocument, rgb, StandardFonts, PageSizes } = await import('pdf-lib');
  return { PDFDocument, rgb, StandardFonts, PageSizes };
}

const PAGE_SIZES: Record<string, [number, number]> = {
  A4:     [595.28, 841.89],
  Letter: [612,    792],
  A3:     [841.89, 1190.55],
  Legal:  [612,    1008],
};

export async function exportDocument(doc: LightDocument, format: DocumentFormat): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await getPdfLib();
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(doc.meta.title);
  pdfDoc.setAuthor(doc.meta.author || doc.meta.organization);
  pdfDoc.setSubject(doc.meta.subtitle);
  pdfDoc.setProducer('LightDoc Studio — .lpdx Format');
  pdfDoc.setCreator('LightDoc Studio');
  pdfDoc.setCreationDate(new Date(doc.meta.createdAt));
  pdfDoc.setModificationDate(new Date(doc.meta.updatedAt));

  // Custom metadata to identify .lpdx files
  if (format === 'lpdx') {
    pdfDoc.setKeywords(['lpdx', 'lightdoc', 'compressed', 'v1.0']);
  }

  const [pageW, pageH] = PAGE_SIZES[doc.meta.pageSize] || PAGE_SIZES.A4;
  const margin = 56.7; // 2cm in points

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  let page = pdfDoc.addPage([pageW, pageH]);
  let y = pageH - margin;
  const contentWidth = pageW - margin * 2;

  function addNewPageIfNeeded(requiredHeight: number) {
    if (y - requiredHeight < margin) {
      // Add footer to current page
      page.drawText(`${doc.meta.title}  •  LightDoc Studio (.lpdx)`, {
        x: margin,
        y: margin - 16,
        size: 8,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });
      page = pdfDoc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  }

  function drawWrappedText(
    text: string,
    x: number,
    startY: number,
    fontSize: number,
    font: typeof helveticaFont,
    color = rgb(0.1, 0.1, 0.1),
    maxWidth = contentWidth,
    lineHeight = 1.5
  ): number {
    const words = text.split(' ');
    let line = '';
    let currentY = startY;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && line) {
        addNewPageIfNeeded(fontSize * lineHeight);
        page.drawText(line, { x, y: currentY, size: fontSize, font, color });
        currentY -= fontSize * lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      addNewPageIfNeeded(fontSize * lineHeight);
      page.drawText(line, { x, y: currentY, size: fontSize, font, color });
      currentY -= fontSize * lineHeight;
    }
    return currentY;
  }

  // ── Document title block ──────────────────────────────────────
  if (doc.meta.title) {
    addNewPageIfNeeded(48);
    y = drawWrappedText(doc.meta.title, margin, y, 22, helveticaBold, rgb(0.05, 0.05, 0.05));
    y -= 4;
  }

  if (doc.meta.subtitle) {
    addNewPageIfNeeded(20);
    y = drawWrappedText(doc.meta.subtitle, margin, y, 11, timesRoman, rgb(0.45, 0.45, 0.45));
    y -= 2;
  }

  if (doc.meta.organization) {
    addNewPageIfNeeded(16);
    y = drawWrappedText(doc.meta.organization, margin, y, 10, helveticaFont, rgb(0.5, 0.5, 0.5));
  }

  // Horizontal rule
  addNewPageIfNeeded(20);
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.82, 0.82, 0.82) });
  y -= 18;

  // ── Document blocks ───────────────────────────────────────────
  for (const block of doc.blocks) {
    if (!block.content && block.type !== 'divider' && block.type !== 'image') continue;

    switch (block.type) {
      case 'heading1': {
        addNewPageIfNeeded(32);
        y -= 6;
        y = drawWrappedText(block.content, margin, y, 18, helveticaBold, rgb(0.05, 0.05, 0.05));
        y -= 4;
        break;
      }
      case 'heading2': {
        addNewPageIfNeeded(28);
        y -= 4;
        y = drawWrappedText(block.content, margin, y, 14, helveticaBold, rgb(0.1, 0.1, 0.1));
        y -= 3;
        break;
      }
      case 'heading3': {
        addNewPageIfNeeded(22);
        y -= 2;
        y = drawWrappedText(block.content, margin, y, 12, helveticaBold, rgb(0.2, 0.2, 0.2));
        y -= 2;
        break;
      }
      case 'paragraph': {
        const font = block.bold ? helveticaBold : block.italic ? timesRoman : helveticaFont;
        const size = block.fontSize || 11;
        addNewPageIfNeeded(size * 2);
        y = drawWrappedText(block.content, margin, y, size, font);
        y -= 6;
        break;
      }
      case 'list': {
        const items = block.listItems || block.content.split('\n').filter(Boolean);
        for (const item of items) {
          addNewPageIfNeeded(18);
          page.drawText('•', { x: margin, y, size: 11, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
          y = drawWrappedText(item, margin + 14, y, 11, helveticaFont, rgb(0.1, 0.1, 0.1), contentWidth - 14);
          y -= 4;
        }
        y -= 4;
        break;
      }
      case 'divider': {
        addNewPageIfNeeded(20);
        y -= 8;
        page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
        y -= 12;
        break;
      }
      case 'image': {
        if (block.imageData) {
          try {
            addNewPageIfNeeded(180);
            const imgBytes = Uint8Array.from(atob(block.imageData.split(',')[1]), c => c.charCodeAt(0));
            const isJpeg = block.imageData.includes('image/jpeg') || block.imageData.includes('image/webp');
            const embeddedImg = isJpeg
              ? await pdfDoc.embedJpg(imgBytes)
              : await pdfDoc.embedPng(imgBytes);
            const imgW = Math.min(contentWidth, embeddedImg.width);
            const imgH = (embeddedImg.height / embeddedImg.width) * imgW;
            addNewPageIfNeeded(imgH + 20);
            page.drawImage(embeddedImg, { x: margin, y: y - imgH, width: imgW, height: imgH });
            y -= imgH + 8;
            if (block.imageCaption) {
              y = drawWrappedText(block.imageCaption, margin, y, 9, timesRoman, rgb(0.5, 0.5, 0.5));
            }
            y -= 8;
          } catch {
            // Skip image if embedding fails
          }
        }
        break;
      }
      case 'table': {
        if (block.tableData && block.tableData.length > 0) {
          const colCount = block.tableData[0].length;
          const colW = contentWidth / colCount;
          const rowH = 18;

          for (let r = 0; r < block.tableData.length; r++) {
            addNewPageIfNeeded(rowH + 4);
            const rowY = y - rowH;
            const isHeader = r === 0;

            if (isHeader) {
              page.drawRectangle({ x: margin, y: rowY, width: contentWidth, height: rowH, color: rgb(0.93, 0.97, 0.95) });
            }
            page.drawRectangle({ x: margin, y: rowY, width: contentWidth, height: rowH, borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.3 });

            for (let c = 0; c < colCount; c++) {
              const cellText = block.tableData[r][c] || '';
              page.drawText(cellText.slice(0, 30), {
                x: margin + c * colW + 4,
                y: rowY + 5,
                size: isHeader ? 9 : 8,
                font: isHeader ? helveticaBold : helveticaFont,
                color: rgb(0.1, 0.1, 0.1),
                maxWidth: colW - 8,
              });
              if (c < colCount - 1) {
                page.drawLine({ start: { x: margin + (c + 1) * colW, y: rowY }, end: { x: margin + (c + 1) * colW, y: rowY + rowH }, thickness: 0.3, color: rgb(0.82, 0.82, 0.82) });
              }
            }
            y -= rowH;
          }
          y -= 10;
        }
        break;
      }
    }
  }

  // Footer on last page
  page.drawText(`${doc.meta.title}  •  LightDoc Studio (.lpdx)  •  ${new Date(doc.meta.createdAt).toLocaleDateString()}`, {
    x: margin,
    y: margin - 16,
    size: 8,
    font: helveticaFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Compress the PDF
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });

  if (format === 'docx') {
    // For DOCX: just return the PDF bytes (the UI will handle labeling)
    // In production, use pandoc or a DOCX library
    return new Uint8Array(pdfBytes.buffer);
  }

  return new Uint8Array(pdfBytes.buffer);
}

export function triggerDownload(bytes: Uint8Array, filename: string, mimeType = 'application/pdf') {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
