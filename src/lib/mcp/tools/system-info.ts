import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "system_info",
  title: "Aurora OS system info",
  description: "Return metadata about the Aurora OS desktop environment demo (version, themes, accents).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      name: "Aurora OS",
      version: "1.0.0",
      kind: "web desktop environment demo (HTML/CSS/vanilla JS)",
      themes: ["dark", "light"],
      accents: ["purple", "blue", "green", "orange", "pink", "red"],
      shortcuts: {
        spotlight: "Ctrl/Cmd+K",
        startMenu: "Ctrl/Cmd+Space",
        muteSounds: "Ctrl/Cmd+M",
      },
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});