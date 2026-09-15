# 知识点清单
- 结构化输出：把 LLM 回复约束到固定 schema（Pydantic）
- `messages.parse` + `output_format=<Pydantic 类>` → `response.parsed_output`
- Pydantic：`BaseModel`、`Enum`、可选字段 `str | None`、`default_factory`
- 非结构化日志 → typed FaultReport 的抽取范式
- 脏输入四类型：incomplete / contradictory / ambiguous / malformed
- 模型选择：opus / sonnet / haiku 的能力与成本取舍
