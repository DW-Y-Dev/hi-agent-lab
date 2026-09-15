# 参考解（私密）

## 必查标记
- 定义 FaultReport Pydantic 模型（severity / component / error_code / timestamp / description / root_cause / affected_systems）
- severity 用 Enum（critical / warning / info）
- optional 字段用 str | None（error_code / timestamp / root_cause 缺失时为 None）
- 用 client.messages.parse + output_format=FaultReport 做结构化输出
- 从 response.parsed_output 取校验后的 FaultReport 实例

（示例代码在 teaching.md 第二部分作为教学材料展示，此处不再重复。）
