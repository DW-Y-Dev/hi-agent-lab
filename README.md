# hi-agent-lab

Claude Code 教学插件 **Hi-agent Lab** —— 用 **Mentor 人格注入 + 私密教学脚本 + 参考解对照 + Socratic 引导** 带学员动手学。

这是一个**插件分发仓库**：`hi-agent-lab/` 是插件本体，根目录的 `.claude-plugin/marketplace.json` 是 marketplace 清单（学生安装的入口）。

## 学生安装

在 Claude Code 终端里执行：

```bash
# 1. 添加 marketplace（指向本仓库）
claude plugin marketplace add DW-Y-Dev/hi-agent-lab

# 2. 安装插件
claude plugin install hi-agent-lab

# 3. 开始第一个 lab
/hi-agent
```

## 仓库结构

```
├── .claude-plugin/marketplace.json   # marketplace 清单（分发给学生的入口）
├── hi-agent-lab/                     # ★ 插件本体
│   ├── README.md                     # 插件完整文档
│   ├── persona.md                    # 全局 Mentor 人格（所有 lab 共用）
│   ├── commands/                     # 斜杠命令（/hi-agent*）
│   ├── server/                       # MCP server（Node + 官方 SDK）
│   └── labs/                         # ★ 课件区 —— 老师在这里加 lab
```

## 给老师：如何加一门课

**加一个 lab = 在 `hi-agent-lab/labs/` 下建文件夹 + 填 3 个文件**（`meta.json` / `teaching.md` / `reference.md`，`kb.md` 可选）。各文件的写法、示例与完整机制见 [`hi-agent-lab/README.md`](hi-agent-lab/README.md)（唯一维护处，本文件不再重复）。
