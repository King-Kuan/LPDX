export type BlockType = "title" | "heading" | "paragraph" | "quote" | "checklist";

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface DocumentMeta {
  title: string;
  description: string;
  author: string;
  updatedAt: string;
  theme: "midnight" | "royal" | "emerald";
  tags: string[];
}

export interface LightDoc {
  id: string;
  meta: DocumentMeta;
  blocks: DocumentBlock[];
  starred: boolean;
}

export interface EditorStats {
  words: number;
  characters: number;
  blocks: number;
  readingMinutes: number;
}
