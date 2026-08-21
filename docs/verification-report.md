# 验证报告



时间：2026-08-20（Phase 0–3 maid-atelier 对齐）



## 构建



- `npm run build`：host `tsc` + `tsdown` client bundle

- `scripts/build.ps1` 从 `src/theme/*.css` 生成 `src/client/theme-css.ts`（单一 CSS 源）

- `lib/client.js` 注册 id：`@dsh-external/dsh-taffy-theme`（无 `@file:` 前缀）



## Phase 0 — 契约冻结



- 新增 `src/client/chrome-selectors.ts`：侧栏、hero、active、composer、titlebar、设置对话框等 DSH 公开选择器

- 构建脚本已验证：`tokens.css` / `components.css` / `motion.css` → `theme-css.ts`



## Phase 1 — 原生 token 映射（可见主题变化）



- `tokens.css`：`body[data-dsh-taffy-theme]` 覆写 `--dsw-alias-bg-*`、`--dsw-alias-brand-*`、`--dsw-alias-label-*`；亮/暗通过 `body[data-ds-dark-theme]` 分支

- `components.css`：`#root` 透明；侧栏 / composer / input-mirror 玻璃霓虹边框

- `user-theme.ts`：`applyThemeTokens` 同步写入 `--dsw-alias-brand-primary`、`--dsw-alias-bg-layer-*` 等

- 新增 `src/client/backdrop.ts`：监听 `data-ds-dark-theme`，设置 body 糖果渐变背景



## Phase 2 — 稳定 chrome 挂载



- 重构 `mount.ts`：`createCharacterStage`（body 级 fixed 立绘）、`createTrims`、`decorateSidebar`；节点带 `data-skin-owner` / `data-skin-chrome`

- 新增 `chrome-observer.ts`：仅在侧栏/hero 结构变化时重装饰，忽略 `data-skin-owner` 节点

- 重构 `index.ts`：chrome 在 init/设置变更时挂载一次；`onState` 只更新徽章与 `data-taffy-state`；hero 用 `[data-phase='hero']`，优先 character-stage



## Phase 3 — 投影状态 + Composer 构图



- 新增 `projected-state.ts`：`data-taffy-chat-active`、`data-taffy-conversation-active`

- 新增 `sidebar-metrics.ts`：ResizeObserver → `--taffy-sidebar-width`

- `state-view.ts`：独立节流；streaming 仅 `[data-streaming="true"]`；工具检测仅 `[data-tool-call]`

- `components.css`：hero / active 阶段 `[data-composer-card]` 构图差异



## 浏览器验收



刷新 `http://127.0.0.1:3080`（若 DSH 已在跑，重启 web 以加载新 bundle）：



1. `body` 有 `data-dsh-taffy-theme`，整页糖果霓虹色（侧栏、按钮、文字 token 明显变化）

2. body 级渐变背景 + 顶部/底部霓虹 trim 条

3. 着陆页可见塔菲立绘（`data-skin-chrome="character-stage"`），不依赖 `[data-phase='empty']`

4. 侧栏有塔菲头像 + 渐变边带；composer 卡片玻璃边框

5. 发消息后 `data-taffy-conversation-active`，立绘外移；composer 停靠样式切换

6. 设置里关闭 Taffy → 官方 UI 完全恢复



## 已知风险



- 与 `dsh-dream-skin` 同时开可能抢主题色

- 图片授权未确认，禁止公开发布素材

- Host `tsc` 仅编译 host 文件；client 由 tsdown 单独打包

- 设置持久化走 localStorage，不是 DSH settings wire

