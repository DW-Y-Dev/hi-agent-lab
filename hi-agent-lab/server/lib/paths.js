import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 插件根目录：优先取 .mcp.json 里传入的 ${CLAUDE_PLUGIN_ROOT}（process.argv[2]），
// 否则回退到 server/ 的上一级（lib/ 再上一级）。
export const pluginRoot = process.argv[2] || path.resolve(__dirname, "..", "..");

export const LABS_DIR = path.join(pluginRoot, "labs");
export const REVIEWS_DIR = path.join(pluginRoot, "reviews");
export const SESSION_FILE = path.join(pluginRoot, ".session.json");
export const PERSONA_FILE = path.join(pluginRoot, "persona.md");
