# hi-agent-lab

Claude Code 教学插件 **Hi-agent Lab** —— 用 **Mentor 人格注入 + 私密教学脚本 + 参考解对照 + Socratic 引导** 带学员动手学。


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

## 课件更新（已安装的同学）

老师发布新课件后，**不要重跑 `install`**。用：

```bash
# 升级到最新版，然后重启 Claude Code 生效
claude plugin update hi-agent-lab
```

## 仓库结构

```
├── .claude-plugin/marketplace.json   # marketplace 清单（分发给学生的入口）
├── hi-agent-lab/                     # ★ 插件本体
│   ├── persona.md                    # 全局 Mentor 人格（所有 lab 共用）
│   ├── commands/                     # 斜杠命令（/hi-agent*）
│   ├── server/                       # MCP server（Node + 官方 SDK）
│   └── labs/                         # ★ 课件区 —— 老师在这里加 lab
```

