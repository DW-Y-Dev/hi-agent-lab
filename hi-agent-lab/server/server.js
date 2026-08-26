import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { listLabs, startLab, getStatus, submitReview } from "./lib/labs.js";
import { checkOutput } from "./lib/check.js";

const server = new McpServer({ name: "hi-agent-lab", version: "0.1.0" });

// 统一包装：把工具返回值序列化成 MCP 文本内容，去掉重复样板
const json = (fn) => async (...args) => ({
  content: [{ type: "text", text: JSON.stringify(await fn(...args), null, 2) }],
});

server.registerTool(
  "list_labs",
  { description: "列出所有可用 lab（读本地 labs/*/meta.json）" },
  json(() => listLabs())
);

server.registerTool(
  "start_lab",
  {
    description:
      "开始一个 lab：返回 SYSTEM OPERATING INSTRUCTIONS（Mentor 人格 + 教学脚本 + 参考解），并把当前 lab 指针写入 .session.json",
    inputSchema: { lab_id: z.string() },
  },
  json(({ lab_id }) => startLab(lab_id))
);

server.registerTool(
  "get_lab_status",
  { description: "返回当前进行中的 lab（读 .session.json）" },
  json(() => getStatus())
);

server.registerTool(
  "check_learner_output",
  {
    description:
      "本地对照参考解判断学员成果是否 on track（返回 verdict + Socratic 提示，不泄露参考解）",
    inputSchema: { lab_id: z.string(), artifact: z.string() },
  },
  json(({ lab_id, artifact }) => checkOutput(lab_id, artifact))
);

server.registerTool(
  "submit_review",
  {
    description: "把学员的反思 + 代码快照追加写到 reviews/<lab-id>.md",
    inputSchema: {
      lab_id: z.string(),
      reflections: z.string(),
      code_snapshot: z.string(),
    },
  },
  json(({ lab_id, reflections, code_snapshot }) =>
    submitReview(lab_id, reflections, code_snapshot)
  )
);

const transport = new StdioServerTransport();
await server.connect(transport);
