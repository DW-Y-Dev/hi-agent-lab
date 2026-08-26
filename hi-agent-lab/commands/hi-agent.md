---
name: hi-agent
description: 教学插件主入口 —— 列出所有 lab + 当前进度，选一个开始
---

0. 先调 `mcp__plugin_hi-agent-lab_hi-agent-lab__get_lab_status` 看有没有进行中的 lab；有就先显示当前进度。
1. 调 `mcp__plugin_hi-agent-lab_hi-agent-lab__list_labs` 列出可用 lab，以表格原样呈现给学员。
2. 用 AskUserQuestion 选项卡让学员选 lab（选项 label 用简短 lab 名）/ 或「先看看」；不要让他手输 lab id。
3. 学员选定后调 `mcp__plugin_hi-agent-lab_hi-agent-lab__start_lab`。
4. 学员只是想看看就别强推，让他选「先看看」即可。
