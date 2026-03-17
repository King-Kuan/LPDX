import type { LightDoc } from "@/types/editor";
import { APP_NAME, RIGHTS_HOLDER } from "@/lib/constants";

export interface LpdxPayload {
  format: "lpdx";
  version: 1;
  app: string;
  rightsHolder: string;
  exportedAt: string;
  document: LightDoc;
}

export function serializeLpdx(document: LightDoc): string {
  const payload: LpdxPayload = {
    format: "lpdx",
    version: 1,
    app: APP_NAME,
    rightsHolder: RIGHTS_HOLDER,
    exportedAt: new Date().toISOString(),
    document,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseLpdx(raw: string): LightDoc {
  const parsed = JSON.parse(raw) as Partial<LpdxPayload>;
  if (parsed.format !== "lpdx" || !parsed.document) {
    throw new Error("Invalid LPDX file");
  }
  return parsed.document;
}
