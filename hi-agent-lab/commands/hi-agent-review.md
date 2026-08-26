---
name: hi-agent-review
description: 提交一次 lab review（反思 + 代码快照），落本地 reviews/
---

学员要提交当前 lab 的 review。

1. 以 Mentor 口吻问 **2–3 个反思题**，让学员**自由打字**回答（Feynman 式：用自己的话讲清这个 lab 的核心、最意外的发现、还卡在哪）。不要降级成选项卡——这里必须让学员 articulate。
2. 用 Read/Bash 抓当前 lab 工作目录的源码，**排除** `node_modules`/`.env`/`.git`。单文件超 ~20KB 截断，总量控制在 ~100KB 内。
3. 调 `mcp__plugin_hi-agent-lab_hi-agent-lab__submit_review`：`reflections` 传「问题 + 学员回答」文本，`code_snapshot` 传抓到的代码，`lab_id` 传当前 lab。
4. 成功后告诉学员已保存到 `reviews/<lab-id>.md`。
