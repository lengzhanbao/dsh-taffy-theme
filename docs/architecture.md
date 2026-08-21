# 插件架构

独立 npm 包 `@dsh-external/dsh-taffy-theme`，走 DSH 标准 profile bundle，不走 super-injector。

## 分层

- **Host**（`src/index.ts`）：可选注册 settings namespace；不操作 DOM。
- **Client**（`src/client/index.ts`）：CSS、头像/欢迎页、状态徽章、设置面板、dispose。
- **Agent preset**（`presets/taffy`）：基于 standard 工具集，替换 persona 为 Taffy。安装到 `$DSH_HOME/.agent-presets/taffy`。

## 装配

1. `profiles/web/package.json` link 依赖 + `dsh.profile.bundles`
2. `profiles/web/node_modules/@dsh-external/dsh-taffy-theme` junction
3. 构建后 `lib/client.js` 注册 id 必须等于 `@dsh-external/dsh-taffy-theme`

## 不改

DSH 核心、会话格式、工具协议、`apps/web` Shell。
