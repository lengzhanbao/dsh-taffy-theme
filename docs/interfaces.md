# 接口

## TaffyAgentState

`idle | thinking | tool-calling | streaming | success | error`

主题只依赖该类型。`mapRuntimeState` 把 DSH DOM/运行时信号映射过来。

## 设置（localStorage `dsh-taffy-theme:v1`）

见执行计划默认 JSON。颜色字段经 `isSafeCssColor` 校验，拒绝 CSS 注入。

## 图片

优先级：用户自定义 > 构建内嵌默认图 > CSS 渐变 fallback。
