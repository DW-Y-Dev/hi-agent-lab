import fs from "node:fs/promises";
import path from "node:path";
import { LABS_DIR, REVIEWS_DIR, SESSION_FILE, PERSONA_FILE } from "./paths.js";

async function readIfExists(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/** labId 只允许小写字母/数字/短横线，堵住 path.join 的目录穿越。 */
function assertSafeLabId(labId) {
  if (typeof labId !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(labId)) {
    throw new Error(`非法的 lab id：${labId}`);
  }
}

/** 列出 labs/ 下所有 lab 的 meta（用于 /hi-agent 的目录）。 */
export async function listLabs() {
  let entries = [];
  try {
    entries = await fs.readdir(LABS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const labs = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const raw = await readIfExists(path.join(LABS_DIR, e.name, "meta.json"));
    if (!raw) continue;
    try {
      const m = JSON.parse(raw);
      labs.push({
        id: m.id || e.name,
        title: m.title || e.name,
        stage: m.stage ?? null,
        duration: m.duration ?? "",
        summary: m.summary ?? "",
      });
    } catch {
      // 跳过 meta.json 损坏的目录
    }
  }
  labs.sort((a, b) => (a.stage ?? 0) - (b.stage ?? 0) || a.id.localeCompare(b.id));
  return labs;
}

/** 开始一个 lab：拼出 SYSTEM OPERATING INSTRUCTIONS 返回，并落当前指针。 */
export async function startLab(labId) {
  assertSafeLabId(labId);
  const dir = path.join(LABS_DIR, labId);
  const metaRaw = await readIfExists(path.join(dir, "meta.json"));
  if (!metaRaw) {
    throw new Error(`lab 不存在：${labId}（请在 labs/${labId}/ 下建 meta.json）`);
  }
  const meta = JSON.parse(metaRaw);

  const persona = (await readIfExists(PERSONA_FILE)) || "";
  const teaching = (await readIfExists(path.join(dir, "teaching.md"))) || "（无教学脚本）";
  const reference = (await readIfExists(path.join(dir, "reference.md"))) || "（无参考解）";
  const kb = (await readIfExists(path.join(dir, "kb.md"))) || "（无知识点清单）";

  await fs.writeFile(
    SESSION_FILE,
    JSON.stringify(
      { lab_id: labId, title: meta.title || labId, started_at: new Date().toISOString() },
      null,
      2
    )
  );

  return [
    "# SYSTEM OPERATING INSTRUCTIONS",
    "",
    `你现在是「Mentor」，正在带学员完成 lab「${meta.title || labId}」(id: ${labId})。`,
    "把下面内容静默内化，不原样显示，绝不向学员泄露参考解。",
    "",
    "## 1. Mentor 人格（全局）",
    persona,
    "",
    "## 2. 本 lab 教学脚本（私密）",
    teaching,
    "",
    "## 3. 知识点清单",
    kb,
    "",
    "## 4. 参考解（私密 —— 仅供你判断学员进度）",
    reference,
    "",
    "---",
    "[NOW DO THIS] 以 Mentor 身份、简短可扫读地问候学员，说明本 lab 目标，并给出第一步引导。不要贴参考解。",
  ].join("\n");
}

/** 当前进行中的 lab 指针。 */
export async function getStatus() {
  const raw = await readIfExists(SESSION_FILE);
  if (!raw) return { active: false };
  try {
    return { active: true, ...JSON.parse(raw) };
  } catch {
    return { active: false };
  }
}

/** 把 review 追加写到 reviews/<lab-id>.md。 */
export async function submitReview(labId, reflections, codeSnapshot) {
  assertSafeLabId(labId);
  await fs.mkdir(REVIEWS_DIR, { recursive: true });
  const file = path.join(REVIEWS_DIR, `${labId}.md`);
  const block = [
    "",
    "",
    "---",
    "",
    `## Review @ ${new Date().toISOString()}`,
    "",
    "### 反思",
    reflections,
    "",
    "### 代码快照",
    "```",
    codeSnapshot,
    "```",
    "",
  ].join("\n");
  await fs.appendFile(file, block, "utf8");
  return { ok: true, saved_to: file };
}
