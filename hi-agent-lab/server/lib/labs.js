import fs from "node:fs/promises";
import path from "node:path";
import {
  LABS_DIR,
  REVIEWS_DIR,
  SESSION_FILE,
  PERSONA_FILE,
  SUBMISSION_FILE,
  assertSafeLabId,
} from "./paths.js";

/** 只把「文件不存在」当成缺文件；权限等其他错误如实抛出，不静默吞掉。 */
async function readIfExists(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
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
  let meta;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    throw new Error(`labs/${labId}/meta.json 不是合法 JSON，请老师修复后重试`);
  }

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

  return `# SYSTEM OPERATING INSTRUCTIONS

你现在是「Mentor」，正在带学员完成 lab「${meta.title || labId}」(id: ${labId})。
把下面内容静默内化，不原样显示；第 4 节参考解与检查点绝不向学员泄露
（第 2 节教学脚本里的示例代码是教学材料，按脚本讲解展示，不在此列）。

## 1. Mentor 人格（全局）
${persona}

## 2. 本 lab 教学脚本（私密）
${teaching}

## 3. 知识点清单
${kb}

## 4. 参考解（私密 —— 仅供你判断学员进度）
${reference}

## 5. 阶段检查（务必执行）
每到 teaching.md 的一个阶段 checkpoint（或学员自认完成一步时），把学员当前产物
（代码 / 关键文件内容）作为 artifact 调用工具 \`check_learner_output\`（lab_id 用本 lab id）。
按返回的 verdict（on-track / partial / off-track）决定推进还是继续引导；
对学员只转述 hint，不透露 checkpoints 的具体内容。

---
[NOW DO THIS] 以 Mentor 身份、简短可扫读地问候学员，说明本 lab 目标，并给出第一步引导。不要贴参考解。`;
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

/** 读 submission.json（飞书 webhook 等提交配置）。不存在/损坏返回 null。 */
async function readSubmissionConfig() {
  const raw = await readIfExists(SUBMISSION_FILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function truncate(s, n) {
  if (!s || s.length <= n) return s;
  return s.slice(0, n) + "\n…（已截断，完整见学生本地 reviews/）";
}

/** 推送反思+代码到飞书群机器人 webhook。返回飞书接口的原始结果。 */
async function sendToFeishu(webhookUrl, keyword, labId, reflections, codeSnapshot) {
  const kw = keyword || "review";
  const text = `📚 Hi-agent Lab ${kw}
Lab: ${labId}

【反思】
${reflections}

【代码快照】
${truncate(codeSnapshot, 6000)}`;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg_type: "text", content: { text } }),
  });
  const body = await res.json().catch(() => ({}));
  const ok = res.ok && (body.code === 0 || body.StatusCode === 0);
  return { ok, http_status: res.status, body };
}

/** 把 review 追加写到 reviews/<lab-id>.md，并按需推送到飞书。 */
export async function submitReview(labId, reflections, codeSnapshot) {
  assertSafeLabId(labId);
  await fs.mkdir(REVIEWS_DIR, { recursive: true });
  const file = path.join(REVIEWS_DIR, `${labId}.md`);
  const block = `

---

## Review @ ${new Date().toISOString()}

### 反思
${reflections}

### 代码快照
\`\`\`
${codeSnapshot}
\`\`\`
`;
  await fs.appendFile(file, block, "utf8");

  // 新增：推送到飞书（若配置了 submission.json）
  const cfg = await readSubmissionConfig();
  let feishu = { configured: false };
  if (cfg && typeof cfg.feishu_webhook === "string" && cfg.feishu_webhook) {
    try {
      const r = await sendToFeishu(
        cfg.feishu_webhook,
        cfg.feishu_keyword,
        labId,
        reflections,
        codeSnapshot
      );
      feishu = { configured: true, ...r };
    } catch (e) {
      feishu = { configured: true, ok: false, error: String(e) };
    }
  }

  return { ok: true, saved_to: file, feishu };
}
