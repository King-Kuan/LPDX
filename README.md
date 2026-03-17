# LightDoc Studio — .lpdx Format

> Create, scan, and export documents that are 65–80% smaller than scanned PDFs, readable in every PDF viewer. All processing is 100% on-device — no server, no cloud, no tracking.

---

## What is .lpdx?

`.lpdx` (LightDoc Exchange) is a compressed, PDF-compatible document format. Files are valid ISO 32000 PDFs that open in Adobe Acrobat, Chrome, macOS Preview, Firefox, and all Android/iOS PDF apps — with zero plugins.

**How compression is achieved:**
| Technique | Saving |
|---|---|
| OCR vector text layer (replaces raster scan) | ~62% |
| AVIF/WebP image compression | ~8–18% |
| PDF object stream optimization | ~6% |
| Font subsetting (only used glyphs) | ~4% |
| **Total** | **65–80%** |

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **pdf-lib** — client-side PDF generation and export
- **Tesseract.js** — in-browser OCR (no server required)
- **mammoth** — DOCX import and text extraction
- **IndexedDB** — all documents cached on device
- **browser-image-compression** — AVIF/WebP image processing
- **lucide-react** — icons

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
lightdoc-studio/
├── app/
│   ├── page.tsx          # Main app — wires all components
│   ├── layout.tsx        # Root layout + metadata
│   └── globals.css       # Design system (DM Serif + Outfit fonts)
├── components/
│   ├── Sidebar.tsx       # Document list, storage meter
│   ├── Toolbar.tsx       # Formatting controls, export
│   ├── DocumentEditor.tsx # Block-based writing surface
│   ├── RightPanel.tsx    # Compression stats + settings
│   ├── StatusBar.tsx     # Word count, compression info
│   ├── ScanModal.tsx     # Camera capture + OCR flow
│   └── ImportModal.tsx   # PDF/DOCX/image import
├── hooks/
│   └── useDocumentStore.ts # Document state + IndexedDB sync
├── lib/
│   ├── storage.ts        # IndexedDB CRUD engine
│   ├── compression.ts    # Compression estimation + AVIF processing
│   ├── export.ts         # pdf-lib PDF generation engine
│   └── ocr.ts            # Tesseract.js OCR + file readers
└── types/
    └── index.ts          # All TypeScript types
```

---

## Converting to Android App

This web app is ready to wrap with **Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init LightDoc com.lightdoc.studio
npm run build
npx cap add android
npx cap copy android
npx cap open android
```

In `capacitor.config.ts`, set `webDir: 'out'` and add `output: 'export'` to `next.config.ts`.

For camera access on Android, add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

No environment variables required — everything runs client-side.

---

## The .lpdx MIME Type

When deploying, register the `.lpdx` extension so browsers handle it correctly:

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*).lpdx",
      "headers": [{ "key": "Content-Type", "value": "application/pdf" }]
    }
  ]
}
```

This ensures `.lpdx` files open in any PDF viewer as a standard PDF fallback.

---

## License

Built by The Palace Tech House — Kigali, Rwanda.
