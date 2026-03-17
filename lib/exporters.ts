import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { LightDoc } from "@/types/editor";
import { serializeLpdx } from "@/lib/lpdx";
import { triggerDownload } from "@/lib/download";

function safeName(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
}

export async function downloadAsLpdx(document: LightDoc) {
  const raw = serializeLpdx(document);
  triggerDownload(`${safeName(document.meta.title)}.lpdx`, new Blob([raw], { type: "application/json" }));
}

export async function downloadAsTxt(document: LightDoc) {
  const text = [
    document.meta.title,
    document.meta.description,
    "",
    ...document.blocks.map((block) => {
      if (block.type === "checklist") {
        return `${block.checked ? "[x]" : "[ ]"} ${block.content}`;
      }
      if (block.type === "quote") {
        return `> ${block.content}`;
      }
      return block.content;
    })
  ].join("\n");
  triggerDownload(`${safeName(document.meta.title)}.txt`, new Blob([text], { type: "text/plain;charset=utf-8" }));
}

export async function downloadAsPdf(document: LightDoc) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 48;
  const wrapWidth = 78;

  const lines: Array<{ text: string; bold?: boolean }> = [
    { text: document.meta.title, bold: true },
    { text: document.meta.description || " " },
    { text: `Author: ${document.meta.author}` },
    { text: " " },
  ];

  document.blocks.forEach((block) => {
    const prefix = block.type === "checklist" ? `${block.checked ? "☑" : "☐"} ` : block.type === "quote" ? "“" : "";
    const suffix = block.type === "quote" ? "”" : "";
    lines.push({
      text: `${prefix}${block.content}${suffix}` || " ",
      bold: block.type === "title" || block.type === "heading",
    });
    lines.push({ text: " " });
  });

  const wrap = (text: string) => {
    const chunks = text.match(new RegExp(`.{1,${wrapWidth}}(\\s|$)|\\S+?(\\s|$)`, "g")) ?? [text];
    return chunks.map((value) => value.trimEnd());
  };

  for (const line of lines) {
    for (const row of wrap(line.text || " ")) {
      if (y < 60) {
        y = 800;
        pdf.addPage([595, 842]);
      }
      const currentPage = pdf.getPages()[pdf.getPageCount() - 1];
      currentPage.drawText(row || " ", {
        x: left,
        y,
        size: line.bold ? 15 : 11,
        font: line.bold ? bold : font,
        color: rgb(0.1, 0.13, 0.22),
      });
      y -= line.bold ? 24 : 17;
    }
  }

  const bytes = await pdf.save();
  triggerDownload(`${safeName(document.meta.title)}.pdf`, new Blob([bytes], { type: "application/pdf" }));
}
