# Taffy × maid-atelier 对齐计划

> 参考架构：[maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier)（只读，禁止复制代码/资产/CSS/文案）  
> 目标：用户打开 `http://127.0.0.1:3080` **肉眼可见**整页变成 Taffy 糖果霓虹皮肤。

## 核心结论

当前 Taffy 插件**能加载**，但只注入了一个小徽章 + 挂在错误选择器 `[data-phase='empty']` 的欢迎卡。  
maid-atelier 的做法是：**把整张 Web GUI 当画布**——覆写 `--dsw-alias-*`、透明 `#root`、body 级角色层、侧栏/Composer 真实 DOM 挂钩。

**一句话优先级：** 先改原生 token + 真实选择器（Phase 1–3），用户才会觉得「装了皮肤」。

---

## 差距分析（maid 做了 / Taffy 没做）

| # | maid-atelier | 当前 Taffy | 影响 |
|---|--------------|------------|------|
| 1 | `body[data-dsh-maid-atelier]` 覆写 `--dsw-alias-*` | 只设 `--taffy-*`，原生 UI 不变 | **用户看不到变化** |
| 2 | `#root` 透明 + body 背景/角色层 | 无 | 无场景感 |
| 3 | `[data-skin-chrome]` 分层 DOM（角色/trim/mascot） | 仅 welcome + badge | 装饰极少 |
| 4 | 投影 `data-*-chat-active`、sidebar-size、composer-motion | 只有 `data-taffy-state` | 无法切换构图 |
| 5 | 选择器 `data-phase='hero'`、`data-composer-card` | 错误用 `empty`、`composer.send` | 立绘不出现 |
| 6 | ResizeObserver → `--maid-sidebar-width` | 无 | 侧栏拖宽不同步 |
| 7 | MutationObserver 分流 + 忽略 skin 节点 | 每次 mutation 全量重挂 | 闪烁/抢 DOM |
| 8 | 工作区树 / 设置层叠 / theme-color | 无 | 细节缺失 |

---

## 必须对齐的架构点

### 插件形状（已对齐，保持）
- Host `apply()` 空函数 + Client 做 UI
- `cordis.patch.yml` insert + `@dsh-external/dsh-taffy-theme`
- `lib/client.js` ModuleLoader id 无 `@file:` 前缀
- localStorage 设置 + slots 设置面板

### 生命周期（需加强）
- 所有 DOM 带 `data-skin-owner="dsh-taffy-theme"` + `data-skin-chrome`
- `ctx.effect` disposer 移除整树
- **禁止** `onState` 触发全量 `mountChrome()`

### 选择器契约（DSH 公开 API，可对齐）

```text
侧栏:  :is([data-pane='sidebar'], [class*='sidebarCol'])
着陆:  [data-phase='hero']
对话:  [data-phase='active'] [data-chat-flow]
输入:  [data-composer-card], [data-input-mirror]
设置:  [data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']
标题:  [class*='titlebar'], header:has([role='tablist'])
```

**不要用：** `[data-phase='empty']`、`[data-slot="composer.send"]`（已过时）

---

## 分阶段执行

### Phase 0 — 契约冻结
- [ ] `src/client/chrome-selectors.ts` 集中选择器常量
- [ ] 构建脚本单一 CSS 源（`theme/*.css` → `theme-css.ts`）
- [ ] 更新 `docs/reference-maid-atelier.md` 选择器表

### Phase 1 — 原生 token 映射（第一次「整页变了」）
- [ ] `tokens.css`：`body[data-dsh-taffy-theme]` 覆写 `--dsw-alias-*`
- [ ] `components.css`：`#root` 透明；pane 背景走 token
- [ ] `user-theme.ts`：Candy/Night/Mint 写 `--dsw-alias-brand-primary` 等
- [ ] `backdrop.ts`：监听 `data-ds-dark-theme`，设 body 渐变背景

### Phase 2 — 稳定 chrome 挂载
- [ ] `mount.ts`：`createCharacterStage`、`createTrims`、`decorateSidebar`
- [ ] 立绘走 body 级 fixed 层，不塞 hero 内部
- [ ] `chrome-observer.ts`：结构变化才重装饰，忽略 `data-skin-owner`

### Phase 3 — 投影状态 + Composer 构图
- [ ] `projected-state.ts`：`data-taffy-chat-active` 等
- [ ] `sidebar-metrics.ts`：ResizeObserver + `--taffy-sidebar-width`
- [ ] `composer-motion.ts`：hero ↔ active 动画
- [ ] `state-view.ts`：agent 状态独立节流；修正 streaming 信号

### Phase 4 — 设置层叠 / 会话树 / 系统铬（后续）
### Phase 5 — 测试 / dream-skin 互斥 / 文档

---

## 验收标准

1. 刷新 3080，`body` 有 `data-dsh-taffy-theme`，侧栏/按钮明显糖果色
2. 着陆页可见塔菲立绘（`character-stage`），不依赖 `empty`
3. 发消息后 composer 停靠、角色外移
4. 设置里关 Taffy → 官方 UI 完全恢复
5. 无 maid 代码/类名/`--maid-*` 出现在 diff 中

---

## 合规

- 禁止复制 maid-atelier 源码、CSS 规则块、art、SVG、文案
- maid 为 CC BY-NC-SA 4.0；Taffy 独立实现 + 自有塔菲图
- 只复用 DSH 产品 DOM API（`data-pane`、`--dsw-alias-*`）
