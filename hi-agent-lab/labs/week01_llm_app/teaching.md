# 教学脚本（私密）

## 目标 / 阶段 checkpoint
- 阶段 A：学员能装好 `anthropic` + `pydantic`，定义一个 `FaultReport` Pydantic 模型（severity / component / error_code / timestamp / description / root_cause / affected_systems），并用 `messages.parse` + `output_format=FaultReport` 把一条非结构化故障日志转成 typed 结果。
- 阶段 B：学员能从 `response.parsed_output` 拿到校验后的 `FaultReport` 实例，并处理 optional 字段缺失（error_code / timestamp / root_cause 为 `None`）。
- 阶段 C：学员能构造四类压测输入（incomplete / contradictory / ambiguous / malformed），把失败样本与原因记到 `failure_log.md`，并能说清「结构化输出 + 明确 schema 为何不等于零失败」。

## 引导策略
- 阶段 A 先讲清「非结构化 → 结构化」的痛点（日志散乱、字段缺失、格式不一），再引出「让模型按固定 schema 抽取」。离散选择给选项卡（「我给骨架 / 你自己写 / 先讲讲」）。选「我给骨架」时用 Write 把 `fault_analyzer.py` 骨架写成文件（`FaultReport` 字段与 `messages.parse` 调用处留 `# TODO`），别整段贴聊天里。
- 阶段 B 让学员自己跑通一条正常日志，用 🔬 实验观察块重新呈现 `parsed_output`（重点看 severity 枚举、affected_systems 的 list 是否按 schema 落了型）。
- 阶段 C 必须让学员打字 articulate：让他自己说「为什么模型在矛盾 / 歧义输入上会失败」「schema 能不能兜住所有脏数据」，别降级成选项卡。

## 常见坑位
- 忘了 `pip install anthropic pydantic`，或 `ANTHROPIC_API_KEY` 没设（客户端报 `AuthenticationError`）。
- 用旧的手搓 json / `output_format` 而不是 `messages.parse` + `output_format=<Pydantic 类>`（parse 自动校验并返回 `parsed_output`）。
- optional 字段没标 `str | None`，缺失时 Pydantic 直接抛 `ValidationError`，而不是返回 `None`。
- `severity` 没定义枚举，模型可能返回 schema 外的新值。
- 压测只跑正常输入，没覆盖 incomplete / contradictory / ambiguous / malformed 四类。

## 收尾 rubric
学员能跑通「一条脏日志 → FaultReport（typed）」，并把 ≥4 类压测输入及其失败记录写进 `failure_log.md` 即算完成；能解释「为什么 schema 明确仍会失败、怎么兜底」为加分。
