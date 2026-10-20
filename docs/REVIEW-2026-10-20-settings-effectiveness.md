# 审阅记录：设置有效性与视觉体系（2026-10-20）

> **状态：仅记录，未实施。**
> 本轮只读了源码与外部项目，**没有修改任何代码、配置或桌面设置**。
> 下面把「已在本仓库源码中核实」与「尚未核实」分开写，避免下次接手时把推测当事实。

---

## 0. 结论

主题在**角色素材与辨识度**上已经不是短板；真正的差距在**设置有效性**与**视觉体系的一致性**：

- 有的选项**看起来是两个选择，实际是同一套效果**；
- 有的滑杆在**当前前提下不会产生任何变化**，但界面没有告诉用户原因；
- 有的注释与文案**描述的是已经删除的行为**，会误导下一次改动；
- 缺少「每个设置 → 最终组件 → 可观察变化」的验收方式。

`0.2.2` 已修复的（不要回退）：水印可见度可调且与底板解耦、三档侧栏边框由单一 `off/simple/full` 状态驱动、
原生按钮保护有静态守卫测试、lockfile 与 `npm ci` 一致。

---

## 1. 已核实的源码问题（附证据）

### 1.1 输入框「玻璃」与「华丽」在 CSS 上是同一套规则 ✅ 已核实

`src/theme/components.css:1460`：

```css
body[data-dsh-taffy-theme][data-taffy-composer='glass'] [data-composer-card],
body[data-dsh-taffy-theme][data-taffy-composer='ornate'] [data-composer-card] {
  border-radius: var(--taffy-composer-radius, 16px);
  background: color-mix(… var(--taffy-composer-opacity, 0.82) …);
}
```

全文件 `data-taffy-composer='ornate'` **只出现 1 次**（就是上面这行），**没有任何 ornate 专属规则**。

→ 结论：`composerStyle` 的 `glass` 与 `ornate` **产生完全相同的效果**。真正决定金饰的是另一个设置
`composerDecoration`。这不是崩溃，但用户切了一个选项却看不到区别。

**建议分工（未实施）**：`composerStyle` 只管材质（原生 / 亚克力 / 柔雾玻璃），
`composerDecoration` 只管花纹密度（关闭 / 简约 / 完整），两者名称不再混用。

### 1.2 设置面板有过期文案 ✅ 已核实

`src/client/settings-panel.ts:456` 当前仍写着：

> 装饰等级选「完整」才会改动侧栏按钮的尺寸与图标。

这与本仓库现在的事实**相反**：`0.2.1` 起已删除全部改动原生按钮的规则，并有
`tests/native-controls-untouched.test.ts` 守着。

### 1.3 `config.ts` 的类型注释同样过期 ✅ 已核实

`src/config.ts:159-162`：

```
* `full` opts into the ornate restyle of the sidebar's own buttons (the
* 56px brand chip, the 40px rail toggle…)
```

56px 品牌圆片与 40px rail 圆钮**早已删除**。这条注释会诱导下一次改动把旧逻辑加回来。

### 1.4 设置面板整体 `@ts-nocheck` ✅ 已核实

`src/client/settings-panel.ts:1` 是 `// @ts-nocheck`。因此面板里写错属性名、传错参数类型，
**类型检查不会报警**，只能靠测试或肉眼。

### 1.5 现有测试覆盖不到「点了有没有用」 ✅ 已核实（结论性判断）

已有 `settings-store` / `chat-look` / `native-controls-untouched` 等 194 项测试，
但它们覆盖的是**配置解析、静态选择器与原生控件守卫**，不覆盖「点击某个控件后，
目标组件的计算样式/尺寸/可见性是否真的变化」。

---

## 2. 未核实的怀疑（不要当结论用）

### 2.1 深色模式下输入框背景可能盖掉 `composerOpacity` ⚠️ 未核实

审阅意见认为：深色模式给输入框指定的背景规则，优先级高于 `0.2.2` 里那条按
`--taffy-composer-opacity` 计算的背景，因此拖动「输入框背景不透明度」可能无效。

我按该意见给出的模式（`[data-ds-dark-theme] [data-composer-card] {…}`）grep **没有命中**，
说明真实规则的选择器形状与描述不同，**需要按实际级联逐条核对后才能定性**。

**核实方法（待做）**：在真实渲染器里对同一个 `[data-composer-card]` 用
`getComputedStyle` 读取 `backgroundColor`，把 `--taffy-composer-opacity` 依次设为
65 / 82 / 100，看返回值是否随之改变。不变即为真冲突。

### 2.2 其余「滑杆是否只在特定条件下生效」⚠️ 部分可推断

- 气泡透明度/圆角/宽度：只在 `userBubbleStyle` 为 `glass`/`ornate` 时才写 CSS 变量（源码可推断）。
- 水印可见度：`sidebarWatermark` 为 `default`/`none` 时不渲染水印层（源码可推断）。
- `composerOpacity`/`composerRadius`：`composerStyle='native'` 时不生效（源码可推断）。

这些**不是 bug，是缺少提示**：面板应当说明「当前条件下此滑杆不产生变化」。

---

## 3. 参考项目（设计思路，不复制资产或代码）

| 项目 | 值得借鉴 |
| --- | --- |
| [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) | 人物背景、装饰层、可交互界面分层管理，花纹不参与按钮布局 |
| [TQSY114514/dsh-ui-appearance](https://github.com/TQSY114514/dsh-ui-appearance) | 控件互相独立、修改即时生效；悬停态与半透明主题一致 |
| [BeiZi6/dsh-theme-plugin](https://github.com/BeiZi6/dsh-theme-plugin) | 用有层级的颜色变量派生主题，而不是各按钮硬编码 |
| [KhanZou/Deepseek-Harness-as-Desktop](https://github.com/KhanZou/Deepseek-Harness-as-Desktop) | 预设卡片带整套界面预览（侧栏/气泡/输入框/发送键） |
| [LilycleHeart/liuli-theme](https://github.com/LilycleHeart/liuli-theme) | 壁纸、材质、气泡、按钮形成统一体系（非具体配色） |
| [RevolutionLA/dsh-dream-skin](https://github.com/RevolutionLA/dsh-dream-skin) | 更新记录里修过「透明度只影响部分卡片」与「深色卡片变灰」，与本仓库处境相近 |

> 适配提醒：这些项目**并不都适配 DSH Desktop 0.2.1-rc.2**，部分面向 Web profile
> 或社区独立桌面壳。只借鉴思想，不复制安装指令与整段 CSS。

---

## 4. 建议的推进顺序（未实施）

### P0 · 设置有效性

1. 建立「设置项 → 配置字段 → CSS 变量 → 宿主组件」映射表。
2. 核实并修复 §2.1 的输入框背景冲突（用 `getComputedStyle` 判定，不靠目测）。
3. 让 `composerStyle` 的 `glass` / `ornate` 有可辨认差异，或合并为一个选项并改名。
4. 不可用的滑杆给出禁用态或说明，而不是"能拖但没反应"。
5. 修正 §1.2 / §1.3 的过期文案与注释。

### P1 · 每个设置都有真实预览

用真实气泡、输入框、侧栏缩略图做预览；明确区分「已保存」与「当前条件下不可见」。

### P2 · 长回复阅读柔纱

独立的可关闭、可调强度的阅读底色，默认不改变现有壁纸，只覆盖正文区域。

### P3 · 以原版输入框统一审美

复用现有 `--taffy-gold-corner-art` / `--taffy-gold-dust-bar` 等素材与配色，按组件面积缩放；
**不重新绘制近似金纹**。

---

## 5. 验收要求（下次实施时）

- 给出「设置项 → 实际生效组件 → 当前结果」明细表；
- 至少一条**计算样式测试**（点击控件后 `getComputedStyle` 的目标属性发生变化），
  而不只是断言配置被写入；
- hover / active / focus / disabled 四态逐一检查，避免主题按钮突变成灰块或白块；
- 禁止用更高优先级的 CSS 掩盖旧规则冲突，优先整理原有规则（本仓库已因此返工过一次）；
- 提供 DSH Desktop 真实截图；未实机验证的一律标注「未验证」。

---

## 6. 明确不做

- 不改动 DSH 原生按钮的布局、尺寸、图标与事件；
- 不删除经典壁纸、新素材、水印与 Q 版选项；
- 不改动 Preset、资源路由与 DSH 版本适配；
- 本文档**不代表**上述问题已经修复。
