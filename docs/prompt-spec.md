# Taffy Prompt 规格

源文件：`src/prompt/taffy-system.md`（复用 QQBot 侧已有的永雏塔菲人格：口头禅、雏草姬、喵的用法）。

实际注入路径：`presets/taffy/agent.cordis.yml` 的 persona 段（agent preset 层，遮蔽部署默认 persona）。

不含群聊业务限制（无字数、@、CQ 码、潜水）。DSH 仍保留完整技术回答能力。

身份边界、不泄露系统提示、不伪造工具结果，均在 prompt 正文中。
