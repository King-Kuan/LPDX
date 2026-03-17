import type { LightDoc } from "@/types/editor";
import { createId } from "@/lib/id";

export function createWelcomeDocument(): LightDoc {
  return {
    id: createId("doc"),
    starred: true,
    meta: {
      title: "Welcome to LightDoc Palace",
      description: "A mobile-first progressive writing space for ideas, notes and polished drafts.",
      author: "The Palace Tech House",
      updatedAt: new Date().toISOString(),
      theme: "royal",
      tags: ["welcome", "starter", "lpdx"]
    },
    blocks: [
      {
        id: createId("block"),
        type: "title",
        content: "Build fast. Write clearly. Export cleanly."
      },
      {
        id: createId("block"),
        type: "paragraph",
        content: "This upgraded studio keeps your work local on the device, feels comfortable on Android phones, and is organized for future expansion into dedicated .lpdx reading."
      },
      {
        id: createId("block"),
        type: "heading",
        content: "What you can do now"
      },
      {
        id: createId("block"),
        type: "checklist",
        content: "Create multiple documents",
        checked: true
      },
      {
        id: createId("block"),
        type: "checklist",
        content: "Edit blocks with a clean mobile layout",
        checked: true
      },
      {
        id: createId("block"),
        type: "checklist",
        content: "Export and import .lpdx files",
        checked: true
      },
      {
        id: createId("block"),
        type: "quote",
        content: "Crafted for creators by The Palace Tech House."
      }
    ]
  };
}

export function createBlankDocument(title = "Untitled Palace Document"): LightDoc {
  return {
    id: createId("doc"),
    starred: false,
    meta: {
      title,
      description: "",
      author: "The Palace Tech House",
      updatedAt: new Date().toISOString(),
      theme: "midnight",
      tags: []
    },
    blocks: [
      {
        id: createId("block"),
        type: "title",
        content: title
      },
      {
        id: createId("block"),
        type: "paragraph",
        content: ""
      }
    ]
  };
}

export function createMeetingTemplate(): LightDoc {
  return {
    ...createBlankDocument("Project Meeting Notes"),
    meta: {
      title: "Project Meeting Notes",
      description: "Team notes, decisions and next steps.",
      author: "The Palace Tech House",
      updatedAt: new Date().toISOString(),
      theme: "emerald",
      tags: ["meeting", "notes"]
    },
    blocks: [
      { id: createId("block"), type: "title", content: "Project Meeting Notes" },
      { id: createId("block"), type: "heading", content: "Agenda" },
      { id: createId("block"), type: "paragraph", content: "Write the meeting goals here." },
      { id: createId("block"), type: "heading", content: "Decisions" },
      { id: createId("block"), type: "checklist", content: "Decision one", checked: false },
      { id: createId("block"), type: "heading", content: "Next Actions" },
      { id: createId("block"), type: "checklist", content: "Assign owners and due dates", checked: false }
    ]
  };
}
