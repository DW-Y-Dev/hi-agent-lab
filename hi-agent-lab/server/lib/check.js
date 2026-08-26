import fs from "node:fs/promises";
import path from "node:path";
import { LABS_DIR } from "./paths.js";

// 极简停用词，够 demo 用（仅英文；中文走 bigram，天然不在停用词里）
const STOP = new Set(
  "the a an is are was were be been to of in on for and or not no it this that with by at from as you your we our they their he she his her do does did will would can could should have has had what when where which how why if then than so but my me i also into over under out up down".split(
    " "
  )
);

/**
 * 分词：英文/数字/下划线按词切，中文按相邻 2 字 bigram 切。
 * 单个大写字母（Q/K/V/T 这类符号）保留，因为本课核心概念就是单字母。
 */
function tokenize(s) {
  const tokens = [];
  const wordRe = /[a-zA-Z0-9_$]+/g;
  let m;
  while ((m = wordRe.exec(s))) tokens.push(m[0]);

  for (const run of s.match(/[一-鿿]+/g) || []) {
    const chars = [...run];
    for (let i = 0; i + 1 < chars.length; i++) tokens.push(chars[i] + chars[i + 1]);
  }

  return tokens
    .filter((t) => {
      const lower = t.toLowerCase();
      if (STOP.has(lower)) return false;
      if (/^[A-Z]$/.test(t)) return true; // Q/K/V/T
      if (/^[a-zA-Z0-9_$]{2,}$/.test(t)) return true;
      if (/^[一-鿿]{2}$/.test(t)) return true;
      return false;
    })
    .map((t) => t.toLowerCase());
}

// 去掉 markdown 代码块，避免代码里的 import/def/return 等泛化词稀释相似度
function stripCodeFences(md) {
  return md.replace(/```[\s\S]*?```/g, " ");
}

// 从 reference.md 的「## 必查标记 / check markers / 检查点」段落里抽出 - 列表
function extractMarkers(reference) {
  const markers = [];
  const lines = reference.split(/\r?\n/);
  let on = false;
  for (const line of lines) {
    if (/^##\s*(必查标记|check\s*markers?|检查点|checkpoints?)/i.test(line)) {
      on = true;
      continue;
    }
    if (on && /^##\s/.test(line)) break;
    if (on && /^\s*[-*]\s+/.test(line)) {
      markers.push(line.replace(/^\s*[-*]\s+/, "").trim());
    }
  }
  return markers;
}

/** 本地对照参考解，判断学员成果是否 on track。不泄参考解。 */
export async function checkOutput(labId, artifact) {
  const refPath = path.join(LABS_DIR, labId, "reference.md");
  let reference;
  try {
    reference = await fs.readFile(refPath, "utf8");
  } catch {
    return { verdict: "unknown", reason: "reference.md 不存在" };
  }

  const markers = extractMarkers(reference);
  const artTokens = tokenize(artifact);
  const artSet = new Set(artTokens);

  const hit = [];
  const missed = [];
  for (const m of markers) {
    const mt = tokenize(m);
    if (mt.length === 0) continue;
    const hitCount = mt.filter((t) => artSet.has(t)).length;
    (hitCount / mt.length >= 0.5 ? hit : missed).push(m);
  }

  // 相似度只对 reference 正文（去代码块）算，避免代码词稀释
  const refTokens = [...new Set(tokenize(stripCodeFences(reference)))];
  const inter = refTokens.filter((t) => artSet.has(t)).length;
  const union = new Set([...refTokens, ...artTokens]).size;
  const similarity = union ? inter / union : 0;

  let verdict;
  if (markers.length === 0) {
    verdict = similarity >= 0.6 ? "on-track" : similarity >= 0.3 ? "partial" : "off-track";
  } else {
    const ratio = hit.length / markers.length;
    verdict = ratio >= 0.7 ? "on-track" : ratio >= 0.4 ? "partial" : "off-track";
  }

  return {
    verdict,
    similarity: +similarity.toFixed(2),
    checkpoints: { hit, missed },
    hint: missed.length
      ? `还没覆盖到：${missed.slice(0, 5).join("；")}。先想想这些点怎么实现。`
      : "关键点都覆盖了，可以继续下一阶段。",
    _disclaimer: "本地启发式对照，仅作教学参考；真机验收请用服务端 held-out。",
  };
}
