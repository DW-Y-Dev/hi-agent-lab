# 参考解（私密）

## 必查标记
- 定义 FaultReport Pydantic 模型（severity / component / error_code / timestamp / description / root_cause / affected_systems）
- severity 用 Enum（critical / warning / info）
- optional 字段用 str | None（error_code / timestamp / root_cause 缺失时为 None）
- 用 client.messages.parse + output_format=FaultReport 做结构化输出
- 从 response.parsed_output 取校验后的 FaultReport 实例
- Part B 构造 incomplete / contradictory / ambiguous / malformed 四类输入
- 把失败样本与原因写入 failure_log.md

（示例代码在 teaching.md 第二部分作为教学材料展示，此处不再重复。）

## 压测样例（课后动手环节用）
- incomplete：只有一行 `disk error on node-7`，缺时间 / 错误码 / 描述
- contradictory：`CRITICAL: db down` 后接 `all systems recovered, normal`
- ambiguous：`那个东西又坏了，赶紧修`
- malformed：`### 0xdeadbeef @@@ 404 `

跑完后把「输入 → 期望 → 实际 → 失败原因」追加进 `failure_log.md`。
