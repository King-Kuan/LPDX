import type { LightDoc } from "@/types/editor";

export function getThemeLabel(doc?: LightDoc | null) {
  switch (doc?.meta.theme) {
    case "emerald":
      return "Emerald";
    case "royal":
      return "Royal";
    default:
      return "Midnight";
  }
}
