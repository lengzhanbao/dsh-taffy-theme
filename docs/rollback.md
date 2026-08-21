# 回滚

1. 设置中关闭 Taffy 模式（不删会话）。
2. 从 `profiles/web/package.json` 的 `dependencies` 与 `dsh.profile.bundles` 移除 `@dsh-external/dsh-taffy-theme`。
3. 删除 `profiles/web/node_modules/@dsh-external/dsh-taffy-theme` junction。
4. 可选：删除 `E:\DeepSeekHarness\.agent-presets\taffy`（不影响官方 standard）。
5. 刷新 3080，确认归档插件与聊天仍可用。

禁止：`git reset --hard`、删除整个 profile、删除会话目录、删除 `E:\塔菲image` 原件。
