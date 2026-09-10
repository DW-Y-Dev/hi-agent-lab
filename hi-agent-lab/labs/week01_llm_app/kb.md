# 知识点清单
- 结构化输出：把 LLM 回复约束到固定 schema（Pydantic）
- `messages.parse` + `output_format=<Pydantic 类>` → `response.parsed_output`
- Pydantic：`BaseModel`、`Enum`、可选字段 `str | None`、`default_factory`
- 非结构化日志 → typed FaultReport 的抽取范式
- 鲁棒性压测：incomplete / contradictory / ambiguous / malformed
- 失败记录：`failure_log.md` 的「输入 → 期望 → 实际 → 失败原因」四列
- 模型选择：opus / sonnet / haiku 的能力与成本取舍
