# 教学脚本（私密）

本 lab 固定**两段式**教学：第一部分先讲基础知识点与术语（默认学员零基础）→ 答题检测；第二部分直接展示示例代码并逐段讲解 → 对代码内容再次提问作最终检测。

## 第一部分：基础知识点与术语（先讲，后问）

**本课任务**：把一条故障日志自动抽成带类型的 `FaultReport`。开场问候先把任务交代给学员，再进入 1.1 讲痛点——学员带着目标听后面的小节。

逐小节讲给学员：每小节用讲义形式重新呈现（标题 + 3–5 句 + 一个小例子），不要整段照贴本文件。术语首次出现时附英文原文。

### 1.1 非结构化 → 结构化
- 日志、工单这类文本是给人看的：字段散在句子里，机器没法直接取。
- 结构化（structured）数据 = 有固定 schema 的数据：每个字段有名字、有类型。

### 1.2 LLM 结构化输出（Structured Output）
- 让模型回复被约束到固定 schema，而不是自由文本。
- Anthropic SDK 用法：`client.messages.parse(..., output_format=<Pydantic 类>)`，返回的 `resp.parsed_output` 是已通过校验的实例。

### 1.3 Pydantic 基础
- `BaseModel`：声明式定义 schema，`severity: Severity` 这类注解就是字段约束。
- `Enum`：把字段限制为固定几个值，模型无法返回枚举外的值。
- 可选字段 `str | None = None`：日志里可能缺失的字段，缺失时是 `None` 而非报错。
- `Field(default_factory=list)`：可变默认值必须给工厂函数，避免多个实例共享同一个 list。

### 1.4 脏输入的四种类型
- incomplete（信息不全）/ contradictory（自相矛盾）/ ambiguous（含糊指代）/ malformed（格式畸形）。
- 记住：schema 再明确也不等于零失败，脏输入仍可能让抽取出错。

### 第一部分检测（学员看完必须打字回答，别降级成选项卡）
1. 用自己的话说说：结构化输出解决了什么问题？
2. `error_code` 为什么声明成 `str | None` 而不是 `str`？声明成 `str` 会发生什么？
3. `severity` 为什么用 Enum 而不是普通字符串？

批改方式：把学员的回答作为 artifact 调 `check_learner_output`，按 verdict 决定推进还是回到对应小节重讲；答错的点先用一句话纠正再继续。

## 第二部分：示例代码讲解（先看，后讲，再问）

把下面的示例代码用 Write 写成学员工作目录的 `fault_analyzer.py`（它是本课教学材料，允许直接展示），然后按「讲解要点」逐段讲。

```python
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
    description: str
    error_code: str | None = None    # 可选：日志可能缺失
    timestamp: str | None = None
    root_cause: str | None = None
    affected_systems: list[str] = Field(default_factory=list)

client = anthropic.Anthropic()  # 读环境变量 ANTHROPIC_API_KEY

def analyze_log(raw_log: str) -> FaultReport:
    return client.messages.parse(
        model="claude-opus-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": raw_log}],
        output_format=FaultReport,
    ).parsed_output

log = "2026-09-10 14:03 CRITICAL auth-service E5001 timeout on login"
print(analyze_log(log).model_dump())
```

### 讲解要点（按顺序逐段讲）
1. `Severity(str, Enum)`：双继承——既当枚举用，序列化时又是普通字符串；值只有三个，模型返回其他值会被校验拒绝。
2. `FaultReport` 字段逐个过：必填（severity / component / description）vs 可选（error_code / timestamp / root_cause）vs 带默认工厂（affected_systems）。
3. `analyze_log` 一行链式拿结果：关键参数是 `output_format=FaultReport`——API 会把模型回复约束到这个 schema；原始日志直接作为 user content 传入即可。
4. `.parsed_output`：拿到的是已通过 Pydantic 校验的 `FaultReport` 实例，不需要自己 `json.loads` + 手动校验。
5. 最后两行：跑一条样例日志，`model_dump()` 把实例转回 dict 打印，验证整条链路。

### 第二部分之后：对示例代码提问（最终检测，必须打字回答）
1. 日志里没有 error_code 时，`parsed_output.error_code` 是什么？为什么不抛 `ValidationError`？
2. `messages.parse` 相比 `messages.create` + 手动 `json.loads` 好在哪？
3. 如果模型返回 `severity: "fatal"`（不在枚举里），会发生什么？
4. 想换更省钱的模型，改哪一行？取舍是什么？

同样把回答作为 artifact 调 `check_learner_output` 做最终对照。

## 常见坑位
- 忘了 `pip install anthropic pydantic`，或 `ANTHROPIC_API_KEY` 没设（`AuthenticationError`）。
- 把可选字段写成 `str`：缺失时 Pydantic 直接抛 `ValidationError`，而不是返回 `None`。
- `affected_systems: list[str] = []`：可变默认值会被所有实例共享，必须 `default_factory`。

## 收尾 rubric
两部分检测问题都能答上（答错处已纠正）即算完成；学员能解释「为什么 schema 明确仍会失败、怎么兜底」为加分。
