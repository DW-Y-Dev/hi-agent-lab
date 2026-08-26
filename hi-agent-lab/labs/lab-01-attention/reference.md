# 参考解（私密）

## 必查标记
- 计算 scores = Q @ K.T（查询与所有键的内积，作为相似度打分）
- scores 除以 sqrt(d_k) 做缩放
- 对 scores 沿最后一维做 softmax 得到注意力权重
- 用权重对 V 做加权求和得到输出
- 返回/打印注意力权重矩阵，且每行求和为 1

## 参考代码
```python
import numpy as np

def scaled_dot_product_attention(Q, K, V):
    d_k = K.shape[-1]
    # 1) 相似度打分：每个 query 对所有 key 求内积
    scores = Q @ K.T                     # (n_q, n_k)
    # 2) 缩放，防止内积过大
    scores = scores / np.sqrt(d_k)
    # 3) softmax 得到注意力权重（每行对各个 key 归一化为 1）
    e = np.exp(scores - scores.max(axis=-1, keepdims=True))   # 数值稳定
    weights = e / e.sum(axis=-1, keepdims=True)
    # 4) 加权求和：用权重聚合 value
    out = weights @ V                    # (n_q, d_v)
    return out, weights

# 例：3 个词，d_k = d_v = 4
Q = K = V = np.random.randn(3, 4)
out, weights = scaled_dot_product_attention(Q, K, V)
print("注意力权重：\n", weights)          # 每行和 ≈ 1
print("输出：\n", out)
```
