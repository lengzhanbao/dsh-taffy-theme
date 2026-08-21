# 生命周期

`apply(ctx)` 内用 `ctx.effect` 注册清理函数：

- 断开 MutationObserver
- 清除时间相位 interval
- 移除 style 节点与注入 DOM
- 去掉 body 上 `data-dsh-taffy-*` / `data-taffy-state` / `data-time-phase`
- `resetStateAdapter()`

HMR：`ensureStyleNode` 按固定 id 复用，不叠加多个 `<style>`。
