# 参考解（私密）

## 必查标记
- 定义 FaultReport Pydantic 模型（severity / component / error_code / timestamp / description / root_cause / affected_systems）
- severity 用 Enum（critical / warning / info）
- optional 字段用 str | None（error_code / timestamp / root_cause 缺失时为 None）
- 用 client.messages.parse + output_format=FaultReport 做结构化输出
- 从 response.parsed_output 取校验后的 FaultReport 实例
- Part B 构造 incomplete / contradictory / ambiguous / malformed 四类输入
- 把失败样本与原因写入 failure_log.md

## 参考代码
```python
# fault_analyzer.py
from enum import Enum
from pydantic import BaseModel, Field
import anthropic

class Severity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class FaultReport(BaseModel):
    severity: Severity
    component: str
    error_code: str | None = None
    timestamp: str | None = None
    description: str
    root_cause: str | None = None
    affected_systems: list[str] = Field(default_factory=list)

client = anthropic.Anthropic()  # 读 ANTHROPIC_API_KEY

def analyze_log(raw_log: str) -> FaultReport:
    resp = client.messages.parse(
        model="claude-opus-5",          # 可换 claude-haiku-4-5 / claude-sonnet-5 省钱
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"把这条故障日志解析成 FaultReport：\n{raw_log}",
        }],
        output_format=FaultReport,
    )
    return resp.parsed_output

if __name__ == "__main__":
    log = "2026-09-10 14:03 CRITICAL auth-service E5001 timeout on login"
    r = analyze_log(log)
    print(r.model_dump())
```

## 压测样例（Part B）
- incomplete：只有一行 `disk error on node-7`，缺时间 / 错误码 / 描述
- contradictory：`CRITICAL: db down` 后接 `all systems recovered, normal`
- ambiguous：`那个东西又坏了，赶紧修`
- malformed：`### 0xdeadbeef @@@ 404 `

跑完后把「输入 → 期望 → 实际 → 失败原因」追加进 `failure_log.md`。
