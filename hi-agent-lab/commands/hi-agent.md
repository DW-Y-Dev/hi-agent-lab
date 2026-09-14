---
name: hi-agent
description: 教学插件主入口 —— 列出所有 lab + 当前进度，选一个开始或继续
---

0. 先调 `mcp__plugin_hi-agent-lab_hi-agent-lab__get_lab_status`：
   - 有进行中的 lab → 先用一两句话给学员汇报进度（在练什么、大概到哪一步），
     并把「继续当前 lab」设为后续选项卡的第一个选项。
   - 没有 → 直接进入下一步。
1. 调 `mcp__plugin_hi-agent-lab_hi-agent-lab__list_labs` 列出可用 lab，以表格原样呈现给学员。
2. 用 AskUserQuestion 选项卡让学员选（label 用简短 lab 名；有进行中的 lab 时第一个选项是
   「继续 <当前 lab>」，其余是各 lab 和「先看看」）；不要让他手输 lab id。
3. 选定后调 `mcp__plugin_hi-agent-lab_hi-agent-lab__start_lab`。
   「继续当前 lab」也调它——重新注入一遍教学脚本，Mentor 状态就回来了。
4. 学员只是想看看就别强推，让他选「先看看」即可。
