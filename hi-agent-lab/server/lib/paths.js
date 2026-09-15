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
// 提交配置：feishu_webhook 等，随仓库分发，学生装好即用（webhook 属公开凭据，被滥用时轮换机器人即可）
export const SUBMISSION_FILE = path.join(pluginRoot, "submission.json");

/** labId 只允许小写字母/数字/短横线/下划线，堵住 path.join 的目录穿越。 */
export function assertSafeLabId(labId) {
  if (typeof labId !== "string" || !/^[a-z0-9][a-z0-9_-]*$/.test(labId)) {
    throw new Error(`非法的 lab id：${labId}`);
  }
}
