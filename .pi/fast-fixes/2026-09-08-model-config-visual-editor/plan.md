# 模型配置可视化编辑器实施计划

- workflowId: `xpi-fast-fix-2026-09-08-model-config-visual-editor`
- createdAt: `2026-09-08T05:29:20+08:00`
- originalRequest: 按调研与选型结论，为 `xpi-model-cfg` 规划 Glimpse 模型供应商与模型列表编辑器，并安全同步全局 `models.json`。
- planStatus: archived
- executionStatus: deferred
- tasks: [`tasks.md`](./tasks.md)
- baseline: [`tasks.initial.md`](./tasks.initial.md)

## 目标

为 Pi 扩展 `xpi-model-cfg` 增加全局模型配置编辑器：使用 Glimpse 展示 HTML 面板，编辑 Provider 与 Model 的结构化配置，先写入 `models.yml` 草稿，再经校验、脱敏 diff、用户确认和安全写入同步到 `~/.pi/agent/models.json`。

## 非目标

- 不引入 React、Ink、Next.js、浏览器交付框架或构建产物。
- 不直接集成 `json-render`、`Object UI` 或 `ObjectStack` 运行时。
- 不管理项目级配置。
- 不执行 `apiKey` 中的 shell 命令，也不解析真实密钥。
- 不实现模型连通性测试。
- 不为全部 `compat` 字段制作专用控件。
- 不自动提交、推送或合并 Git。

## 证据

- 本项目 `AGENTS.md` 要求 Pi 直接加载 `src/index.ts`，使用 Pi 原生 API，禁止 React/Ink 类终端接管方案。
- `DESIGN.md` 要求高密度、可读、低干扰界面；Glimpse 可提供独立 WebView，因此 HTML/CSS 只承担面板渲染，不替代 Pi TUI。
- `docs/references/models-config-ref.md` 定义了 Provider、Model、`modelOverrides`、`samplingParams`、`cost`、`compat` 及环境变量/shell 引用语义。
- `json-render` 的 Ink renderer 依赖 Ink 与 React，Shadcn 包依赖 React、React DOM、Tailwind 和 Radix，且包通过 tsup 构建。
- `Object UI` 的 form/components 包依赖 React/React DOM、Tailwind、Vite 和一组浏览器 UI 运行时。
- `ObjectStack` 是包含数据、权限、REST、MCP、Console 和 Studio 的完整应用平台，范围远大于本扩展。
- 已安装 `glimpseui@0.8.1`，提供原生 WebView、HTML/CSS 和 `window.glimpse.send()` 双向通信。

## 选型决策

### 采用

- Glimpse：作为面板容器和 HTML 交互桥。
- 原生 HTML 控件：输入框、选择框、复选框、列表、折叠区和确认对话框。
- Shadcn 风格原则：中性表面、低圆角、清晰 focus ring、紧凑间距、可访问的键盘操作；不引入 Shadcn 运行时。
- `models.yml`：全局人类/面板编辑草稿，直接镜像 `models.json` 结构。
- `models.json`：Pi 实际读取的运行产物。

### 安全写入协议

```text
read JSON → parse YAML draft → validate → detect external change
→ redacted diff → user confirm → backup → chmod 0600 temp file
→ atomic rename → notify Pi reload
```

- YAML 不得无条件覆盖外部修改。
- 记录载入时的 `models.json` 哈希，应用前重新校验。
- 哈希变化时阻止应用，要求重新导入。
- 写入前生成同目录 `models.json.bak.<timestamp>`。
- 临时文件设置 `0600`，成功后原子重命名。
- 未知字段必须保留，保证 Pi 新增配置字段可以 round-trip。
- API key、headers 和命令引用在 UI、diff、日志中默认掩码；引用文本本身可以保留。

## 面板范围

核心 Provider 字段：`baseUrl`、`api`、`apiKey`、`headers`、`authHeader`、`models`、`modelOverrides`。

核心 Model 字段：`id`、`name`、`api`、`reasoning`、`input`、`contextWindow`、`maxTokens`、`samplingParams`、`cost`、`compat`。

Provider 列表和 Model 列表使用结构化编辑；复杂 `compat` 和未来字段通过高级对象编辑区处理，不在 MVP 中为每个字段建立独立 UX。

## 实施范围

- 配置模型、解析、导出、脱敏和哈希。
- 校验、冲突检测、diff、备份和原子写入。
- Glimpse runtime 解析验证。
- Glimpse Provider/Model 编辑面板。
- `/xpi-model-cfg` 命令接入。
- 测试、README 和安全行为说明。

## 风险与失败处理

- YAML/JSON malformed：拒绝保存，原文件不变。
- 外部修改：阻止覆盖，要求重新导入。
- 写入失败或进程中断：原 JSON 不变，临时文件不作为有效配置。
- 密钥泄露：不执行命令，不输出解析后的值，测试使用占位引用。
- Glimpse 不可用：扩展保持可加载并返回明确错误。
- 未知字段误删：通过保留原始对象字段和 round-trip 测试防止。

## 假设与默认值

- 作用域默认只有 `~/.pi/agent/models.json` 与同目录 `models.yml`。
- `models.yml` 直接镜像 JSON，不增加 profile/version 包装层。
- 每次成功应用都保留备份；备份清理策略延后。
- 第一个版本不提供恢复按钮，恢复通过备份文件和人工操作完成。
- 第一个版本不自动刷新 Pi 模型列表，只在成功写入后提示用户按 Pi 现有机制重新加载。

## 验证门禁

每个任务必须先执行其任务行中的 `verify` 命令。最终必须全部通过：

```bash
pnpm typecheck
pnpm -w run lint
pnpm test
pi -e ./src/index.ts
```

完成条件：所有任务为 `done`，`tasks.md` 与 `tasks.initial.md` 的任务 id/顺序一致，且最终质量门禁全部成功。
