import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const APPS = [
  { id: "files", name: "Files", description: "Browse the virtual file system." },
  { id: "browser", name: "Browser", description: "A minimal web-style browser shell." },
  { id: "notepad", name: "Notepad", description: "Plain-text editor with local autosave." },
  { id: "gallery", name: "Gallery", description: "Image gallery viewer." },
  { id: "music", name: "Music", description: "Audio player with playlist." },
  { id: "calculator", name: "Calculator", description: "Basic calculator." },
  { id: "terminal", name: "Terminal", description: "Aurora shell CLI." },
  { id: "settings", name: "Settings", description: "Theme, accent, and system options." },
];

export default defineTool({
  name: "list_apps",
  title: "List Aurora OS apps",
  description: "Return the catalog of apps available in the Aurora OS desktop demo.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(APPS, null, 2) }],
    structuredContent: { apps: APPS },
  }),
});