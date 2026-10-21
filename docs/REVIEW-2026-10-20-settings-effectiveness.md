# 审阅记录：设置有效性与视觉体系（2026-10-20）

> **状态：仅记录，未实施。**
> 本轮只读了源码与外部项目，**没有修改任何代码、配置或桌面设置**。
>
> **证据等级（本文件的统一口径，每条结论都必须标注其一）**
>
> | 等级 | 含义 | 允许的措辞 |
> | --- | --- | --- |
> | **源码已确认** | 在本仓库源码里可直接读出的事实（行号、特异性、规则体） | 「已核实」 |
> | **运行时已确认** | 在真实渲染器/桌面实例里取到的计算样式或截图 | 「已实测」 |
> | **设计建议** | 由源码可推断，但属于取舍而非缺陷 | 「建议」 |
> | **潜在风险** | 机制由第三方源码或文档证实，本机是否触发未证实 | 「待当前宿主确认」 |
>
> 一个结论**只能**标注它真正达到的等级；不允许用「已核实」涵盖未取证的运行时表现。

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

### 1.1 输入框「玻璃」与「华丽」在 CSS 上是同一套规则 ✅ 源码已确认

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

### 1.2 设置面板有过期文案 ✅ 源码已确认

`src/client/settings-panel.ts:456` 当前仍写着：

> 装饰等级选「完整」才会改动侧栏按钮的尺寸与图标。

这与本仓库现在的事实**相反**：`0.2.1` 起已删除全部改动原生按钮的规则，并有
`tests/native-controls-untouched.test.ts` 守着。

### 1.3 `config.ts` 的类型注释同样过期 ✅ 源码已确认

`src/config.ts:159-162`：

```
* `full` opts into the ornate restyle of the sidebar's own buttons (the
* 56px brand chip, the 40px rail toggle…)
```

56px 品牌圆片与 40px rail 圆钮**早已删除**。这条注释会诱导下一次改动把旧逻辑加回来。

### 1.4 设置面板整体 `@ts-nocheck` ✅ 源码已确认

`src/client/settings-panel.ts:1` 是 `// @ts-nocheck`。因此面板里写错属性名、传错参数类型，
**类型检查不会报警**，只能靠测试或肉眼。

### 1.5 现有测试覆盖不到「点了有没有用」 ✅ 源码已确认（结论性判断）

已有 `settings-store` / `chat-look` / `native-controls-untouched` 等 194 项测试，
但它们覆盖的是**配置解析、静态选择器与原生控件守卫**，不覆盖「点击某个控件后，
目标组件的计算样式/尺寸/可见性是否真的变化」。

---

## 2. 核实过程与结论

本节按**证据等级**分三类，不再混用「已核实 / 未核实」的二元说法。

### 2.1 【已核实 · 源码层叠冲突】深色模式下输入框背景不透明度被覆盖

**证据等级：源码已确认（非运行时取证）。**

两条规则如下，行号与特异性均为本仓库实测：

```css
/* src/theme/components.css:444   特异性 (0,3,1) */
body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card],
body[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] {
  background: var(--taffy-acrylic-dark);
}

/* src/theme/components.css:1460  特异性 (0,2,1) */
body[data-taffy-composer='glass'] [data-composer-card],
body[data-taffy-composer='ornate'] [data-composer-card] {
  background: color-mix(in srgb, var(--taffy-acrylic-light)
    calc(var(--taffy-composer-opacity, 0.82) * 100%), transparent);
}
```

`(0,3,1) > (0,2,1)`，因此**后者即使写在文件更后，也无法在深色模式下覆盖前者的 `background`**。
结论：「输入框背景不透明度」这一项在深色外观下**取不到最终样式效果** —— 变量写了、滑杆能拖，
但最终 `background` 由第 444 行决定。

**证据范围的边界（必须保留）**：以上是**源码层叠级别的确认**，不是 DSH Desktop 运行时
`getComputedStyle` 的取证。桌面实例里是否还有第三条规则介入，本文件不下断言。

**建议修复方向（未实施）**：把输入框背景收敛为**单一最终声明** —— 深浅色模式只提供**基底色**，
`--taffy-composer-opacity` 只提供 **alpha**，`composerStyle` 只提供**材质（模糊/亮面/边缘）**，
三者不再用各自独立的 `background` 相互竞争。规则本身应整理，而不是再加一条更高优先级去压。

**运行时取证方法（待做）**：对同一个 `[data-composer-card]` 读 `getComputedStyle(...).backgroundColor`，
把 `--taffy-composer-opacity` 依次设为 65 / 82 / 100；若不随值改变即坐实运行时表现。

### 2.2 【源码已确认 · 设计建议】其余滑杆只在特定条件下生效

以下由源码可推断（非运行时取证），属**缺少提示**而非功能故障：

- 气泡透明度/圆角/宽度：只在 `userBubbleStyle` 为 `glass`/`ornate` 时才写 CSS 变量。
- 水印可见度：`sidebarWatermark` 为 `default`/`none` 时不渲染水印层。
- `composerOpacity`/`composerRadius`：`composerStyle='native'` 时不生效。

设计建议：这些条件下应**灰显滑杆并说明原因**，而不是让用户拖动一个不会产生变化的控件。

### 2.3 【潜在风险 · 待当前宿主确认】插件卸载时可能误删其他插件的 style

**证据等级：风险机制已由第三方源码证实；本机 DSH Desktop 0.2.x 是否触发，未证实。**

参考实现：`Small-tailqwq/dsh-deep-whale` 的
`maid-atelier/src/client/release-claimed-styles.ts`
（<https://github.com/Small-tailqwq/dsh-deep-whale>）。该文件记录了一个**宿主样式所有权标记机制**：

> 每个 plugin 的 factory 跑完后，client loader 会给**所有没有 `data-plugin` 属性的 `<style>`**
> 打上该 plugin 的 id（注释称 "HMR bookkeeping"）；plugin 的 effect 清理后，
> 会删除**所有带该 id 的标签**。

该项目的注释同时说明触发条件：**皮肤类插件被重载/切换的频率远高于其他插件**，于是其他插件
在运行时注入的样式（CSS-in-JS 规则标签、懒加载组件样式表）会被皮肤插件认领，随后随皮肤一起被删，
表现为「某些界面的样式突然消失、刷新才恢复」。

**本仓库现状（已核实）**：
- `src/client/styles.ts:16` 已给本插件自己的样式节点加上
  `data-plugin-css="@dsh-external/dsh-taffy-theme"`，因此**本插件自己的样式不会被认领**。
- `src/client/styles.ts:22` 的 `removeStyleNode()` 只按 id 删除自己那一个节点（`index.ts:171` 调用）。
- **没有**对应的「释放被误认领标签」的保护。全库 `data-plugin-css` 仅出现 1 处。

**为什么先不移植**：参考项目只能证明它曾针对该问题写过防护，**不能单独证明本机 0.2.x 宿主
会触发同一问题**；而且释放动作必须与当前宿主的卸载生命周期、调用时机匹配，否则可能产生新的副作用。
故本轮只记录机制与风险，不复制那五行代码。

**未来修复候选**：在卸载路径里只处理「带本插件 id、且不带 `data-plugin-css`」的 `<style>` 标签
（即别人注入、被误归属给我们的那些），摘掉 `data-plugin` 而不删除节点；
需要先在真实宿主里确认 loader 的标记与清理时机，再决定接入点。


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
2. **修复 §2.1 已确认的层叠冲突**：把输入框背景收敛为单一最终声明（基底色 / alpha / 材质分离），
   规则本身要整理，**不允许再加一条更高优先级去压**。修完用 `getComputedStyle` 在
   65 / 82 / 100 三档取值对比，并将该条升级为「运行时已确认」。
3. 让 `composerStyle` 的 `glass` / `ornate` 有可辨认差异，或合并为一个选项并改名。
4. 不可用的滑杆给出禁用态或说明，而不是"能拖但没反应"。
5. 修正 §1.2 / §1.3 的过期文案与注释。
6. 复核 §2.3 的样式所有权风险：先在真实宿主里确认 loader 的标记与清理时机，再决定接入点。

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

