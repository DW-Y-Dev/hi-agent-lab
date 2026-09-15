# Hi-agent Lab

一个用于教学的 Claude Code 插件 demo，核心教学机制：

> **Mentor 人格注入 + 私密教学脚本 + 参考解对照 + Socratic 引导**

课件内容全部是**本地文件**，老师只需「建文件夹 + 填文件」即可加一门课，零部署、零外部服务。

---

## 架构（三层）

| 层 | 位置 | 作用 |
|:--|:--|:--|
| 命令层 | `commands/*.md` | 斜杠命令，编排 LLM 怎么当 Mentor |
| MCP 层 | `server/dist/server.js` | 打包后的 MCP server（自包含，学生无需 `npm install`），把课件暴露成工具给 LLM |
| 内容层 | `labs/` | 课件（本地文件，老师在这里加） |

```
hi-agent-lab/
├── persona.md                 # 全局 Mentor 人格（写一次，所有 lab 共用）
├── .claude-plugin/plugin.json # 插件清单
├── .mcp.json                  # 挂 MCP server
├── commands/                  # 斜杠命令
├── server/                    # MCP server（node + 官方 SDK）
│   ├── server.js              # 源码
│   ├── dist/server.js         # ★ 打包产物（自包含，.mcp.json 指向这里）
│   └── lib/{paths,labs,check}.js
├── labs/                      # ★ 课件区 —— 老师在这里加 lab
├── submission.json            # 提交配置：feishu_webhook（随仓库分发，学生装好即用）
└── reviews/                   # (运行时生成) 提交的 review
```

**核心机制一句话**：`start_lab` 把 `persona.md` + 该 lab 的 `teaching.md` + `reference.md` 拼成一段
「SYSTEM OPERATING INSTRUCTIONS」注入给 LLM，命令它静默内化、不泄参考解、用 Socratic 引导学员。
学员成果由 `check_learner_output` 对照参考解做本地启发式判断。

---

## 安装

### 方式一：本地快速跑通（推荐先这样试）

> server 已打包成 `server/dist/server.js`（自包含），**无需 `npm install`**。

1. 注册 MCP server（把 `<插件根>` 换成本目录绝对路径）：
   ```bash
   claude mcp add hi-agent-lab -- node "<插件根>/server/dist/server.js" "<插件根>"
   ```
2. 把命令放进 `~/.claude/commands/`（文件名即命令名）：
   ```
   commands/hi-agent.md         -> ~/.claude/commands/hi-agent.md
   commands/hi-agent-start.md   -> ~/.claude/commands/hi-agent-start.md
   commands/hi-agent-status.md  -> ~/.claude/commands/hi-agent-status.md
   commands/hi-agent-review.md  -> ~/.claude/commands/hi-agent-review.md
   commands/hi-agent-help.md    -> ~/.claude/commands/hi-agent-help.md
   ```
3. 重启 Claude Code，输入 `/hi-agent` 即可看到 lab 列表并开始。

### 方式二：作为插件 / marketplace 分发给学生

把 `hi-agent-lab/` 放进一个 git 仓库，在它的**上一级**放一份 marketplace 清单
`.claude-plugin/marketplace.json`（已提供模板，`source` 指向 `./hi-agent-lab`）。
学生先 `claude plugin marketplace add <那个上一级目录>`，再 `claude plugin install hi-agent-lab` 即可。
（`.mcp.json` 里的 `${CLAUDE_PLUGIN_ROOT}` 会自动解析到插件安装位置。）

> MCP server 已打包成 `server/dist/server.js` 提交，学生**无需再 `npm install`**。

### 重新打包 MCP server（改 server 源码后）

改了 `server/*.js` 后，重新生成自包含的 `server/dist/server.js`：

```bash
cd server && npm run build
```

（即 `npx --yes esbuild server.js --bundle --platform=node --format=esm --outfile=dist/server.js`，
`npx` 会临时拉 esbuild，无需常驻安装到项目里。）

---

## ★ 如何添加一门课（lab）

**加一个 lab = 建一个文件夹 + 填 3 个文件**（第 4 个可选）。

### 1. 建文件夹
```
labs/
└── lab-02-build-tool/     # 文件夹名即 lab id（建议 lab-NN-小写短横线）
    ├── meta.json          # 必填：目录信息
    ├── teaching.md        # 必填：Mentor 私密教学脚本
    ├── reference.md       # 必填：参考解
    └── kb.md              # 可选：知识点清单
```

### 2. `meta.json`（必填，显示在 `/hi-agent` 列表里）
```json
{
  "id": "lab-02-build-tool",
  "title": "给 agent 装一个工具",
  "stage": 2,
  "duration": "2–3h",
  "summary": "一句话简介，出现在 /hi-agent 的列表卡片里"
}
```

### 3. `teaching.md`（必填，Mentor 私密教学脚本）
`start_lab` 会把整段注入给 LLM。教学方式固定为**两段式**：

- **第一部分：知识点讲授 + 检测**。默认学员零基础：先列出本课的基础知识点与术语（每小节 3–5 句 + 小例子），学员看完后回答几个相关问题（打字为主，别降级成选项卡）。
- **第二部分：示例代码讲解 + 提问**。直接给出示例代码，逐段讲解要点；讲完后对代码内容再次提问作最终检测。
- 可选补充：课后动手练习、常见坑位、收尾 rubric。
- 两个检测点都把学员回答作为 artifact 调 `check_learner_output` 对照。

注意保密边界：**teaching.md 第二部分的示例代码是教学材料，允许展示给学员；`reference.md` 的「必查标记」是私密检查点，绝不泄露。**

参考 `labs/week01_llm_app/teaching.md` 的写法。

### 4. `reference.md`（必填，参考解）
学员成果要对照的参考答案。想让 `check_learner_output` 更准，就在文件里加一节：

```markdown
## 必查标记
- 关键点一（用一句短话描述，越具体越好）
- 关键点二
```

`check_learner_output` 会抽出这些 `- 标记`，逐条和学员产物做 token 重叠判断，返回
`on-track / partial / off-track` + 缺了哪些点的 Socratic 提示。没有这节时退化为整体相似度判断。

### 5. `kb.md`（可选）
这个 lab 覆盖的知识点清单，`start_lab` 时随教学脚本一起注入给 Mentor 作引导参考。

### 6. `persona.md`（全局，写一次）
Mentor 的通用人格（语气、禁忌、`📚 [Lab ...]` 结尾格式）。所有 lab 共用，一般不用动。

---

## 常用命令

| 命令 | 作用 |
|:--|:--|
| `/hi-agent` | 主入口：列 lab + 进度 → 开始或继续 |
| `/hi-agent-start [lab_id]` | 开始一个 lab |
| `/hi-agent-status` | 当前进度 |
| `/hi-agent-review` | 提交 review（反思 + 代码快照 → `reviews/`） |
| `/hi-agent-help` | 命令清单 |

---

## 局限 & 升级指引（当前刻意简化）

1. **参考解不保密**：本地文件就在学员机器上，学员能直接翻到 `reference.md`。
   → 想真正「held-out」：把 `reference.md`（和 `check_learner_output` 的比对逻辑）挪到一个服务端，
   MCP server 改成 HTTP 调它，让 `check_learner_output` 在**服务端**和参考解比对，
   答案永不下发。
2. **review 走课程群飞书机器人**：`submission.json`（webhook 随仓库分发）配置的群机器人接收学员提交，同时落本地 `reviews/`。webhook 属公开凭据——被滥用时删掉机器人重新生成、更新此文件即可；要严格的收发控制请换成后端中转。
3. **无 OTP 登录 / 无账号体系**。多人场景需要后端加身份。
4. **检查是启发式**（token 重叠），只做教学参考，不是真验收。真机验收请用服务端 held-out 打分器。

把这几处替换掉，就能一步步长成真正的服务端验证版。
