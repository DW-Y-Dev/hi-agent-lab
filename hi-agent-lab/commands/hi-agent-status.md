---
name: hi-agent-status
description: 显示当前 lab 进度
---

调 `mcp__plugin_hi-agent-lab_hi-agent-lab__get_lab_status` 汇报当前进行中的 lab。若有，结合 `mcp__plugin_hi-agent-lab_hi-agent-lab__list_labs` 里的信息给学员一个简短的进度概览（在练什么、大概到哪一步）；若没有，提示用 `/hi-agent` 选一个开始。
