# Taffy UI 当前执行提示词

只改 Taffy 插件，不改 DSH 核心、不改其他插件。

参考 `E:\dsh-deep-whale-main\maid-atelier` 的层次、材质、构图、生命周期；不复制代码、素材、Logo、文案。

## 必须交付

1. 对话框是完整 Taffy 舞台，不是小边框。粉金外框 + 金色内线 + 顶部徽章 + 糖果角标 + 顶/底帘子。框按 chat-flow 横向、viewport 纵向测量，再向外扩，必须包住对话文本。不包 sidebar / details / 右插件。`transition: none`。
2. 透明度走设置项：`frameOpacity`、`panelOpacity`、`backgroundVeil`，对应 `--taffy-frame-opacity`、`--taffy-panel-opacity`、`--taffy-veil-opacity`。浅色/深色默认不同。centerCol 锁定 `0.16 / 0.22`。modal 保持高不透明。
3. wallpaper 在底层，veil 只做轻遮罩。未声明 acrylic 的插件不改背景。
4. 左角色静态。右角色跟随右侧框，先移动再缩小，过宽后隐藏。加油喵在 settings 正上方；黑色模式用 `avatar-night`。
5. 所有装饰：`pointer-events: none`，`aria-hidden=true`，`data-skin-owner=dsh-taffy-theme`。
6. 修改后重建 `theme-css.ts` 和 `lib/client.js`。
