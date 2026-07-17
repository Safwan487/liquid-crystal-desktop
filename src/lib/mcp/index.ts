import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listAppsTool from "./tools/list-apps";
import systemInfoTool from "./tools/system-info";

export default defineMcp({
  name: "aurora-os-mcp",
  title: "Aurora OS MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Aurora OS web desktop demo. Use `list_apps` to see the built-in apps, `system_info` for OS metadata (themes, accents, shortcuts), and `echo` to verify connectivity.",
  tools: [echoTool, listAppsTool, systemInfoTool],
});