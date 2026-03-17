import type { EditorStats, LightDoc } from "@/types/editor";

export function computeStats(doc?: LightDoc | null): EditorStats {
  if (!doc) {
    return { words: 0, characters: 0, blocks: 0, readingMinutes: 0 };
  }

  const text = doc.blocks.map((block) => block.content).join(" ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const characters = text.length;
  const blocks = doc.blocks.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220 || 0));

  return { words, characters, blocks, readingMinutes };
}
