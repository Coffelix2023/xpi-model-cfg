# 任务工作副本

> 只读基线说明：本文件是执行工作副本；任务 id 和顺序必须始终与 `tasks.initial.md` 一致。执行过程中只更新本文件的状态和验证记录。

- workflowId: `xpi-fast-fix-2026-09-08-model-config-visual-editor`
- createdAt: `2026-09-08T05:29:20+08:00`
- originalRequest: 按调研与选型结论，为 `xpi-model-cfg` 规划 Glimpse 模型供应商与模型列表编辑器，并安全同步全局 `models.json`。
- planStatus: archived
- executionStatus: completed

## 1. 配置契约与解析
- [x] 1.1 定义 models.json/models.yml 类型与字段分组（验收:覆盖 provider、model、modelOverrides、samplingParams、cost、compat，并允许未知字段保留；验证:`pnpm typecheck`）
  - 验证记录: `pnpm typecheck` 通过；`pnpm -w run lint` 通过；LSP 诊断 0。
  - 全量测试记录: `pnpm test` 在 120s 超时，失败集中于 `docs/references/github-packages` 下第三方参考仓库测试，包含缺失 `zod`、`@oclif/core`、浏览器 `document` 和系统 `timeout`；与本任务新增类型模块无直接关联。
- [x] 1.2 实现 JSON/YAML 导入、镜像导出、脱敏与哈希计算（验收:解析失败拒绝、引用原样保留、敏感值不进入日志；验证:`pnpm test -- --run src/lib/models-config.test.ts`）
  - 验证记录: `pnpm exec vitest run src/lib/models-config.test.ts` 通过。

## 2. 安全写入
- [x] 2.1 实现校验、外部变更检测、脱敏 diff 与确认前数据结构（验收:基线哈希变化时阻止应用；验证:`pnpm test -- --run src/lib/models-config.test.ts`）
  - 验证记录: `pnpm exec vitest run src/lib/models-config.test.ts` 通过。
- [x] 2.2 实现备份、0600 临时文件与原子替换（验收:写入失败保留原文件，成功后生成备份且 JSON 可解析；验证:`pnpm test -- --run src/lib/models-persistence.test.ts`）
  - 验证记录: `pnpm exec vitest run src/lib/models-persistence.test.ts` 通过。

## 3. Glimpse 面板
- [x] 3.1 验证 Glimpse 在 Pi 扩展中的运行时解析路径（验收:不硬编码开发机绝对路径，Glimpse 不可用时扩展仍能加载；验证:`pi -e ./src/index.ts`）
  - 验证记录: Glimpse 解析测试 3 项通过；`pi -e ./src/index.ts --list-models` 成功加载。
- [x] 3.2 实现 Provider 列表、Model 编辑、敏感字段掩码与高级字段区（验收:支持核心字段，未知字段可查看/保留，支持键盘确认与取消；验证:`pnpm test -- --run src/ui/model-config-panel.test.ts`）
  - 验证记录: `pnpm exec vitest run src/ui/model-config-panel.test.ts` 3 项通过。
- [x] 3.3 实现 Import、Validate、Preview Diff、Apply、Cancel 工作流（验收:Apply 只能通过显式确认触发，状态和错误可见；验证:`pnpm test -- --run src/ui/model-config-panel.test.ts`）
  - 验证记录: 面板工作流测试 5 项通过，覆盖只读预览、显式确认、外部变更阻止和取消。

## 4. Pi 接入与文档
- [x] 4.1 将面板接入 /xpi-model-cfg 命令并处理通知/关闭/异常状态（验收:命令可启动面板，取消不改文件，异常不导致扩展退出；验证:`pi -e ./src/index.ts`）
  - 验证记录: 扩展命令测试 3 项通过；Pi 冒烟加载通过。
- [x] 4.2 更新 README 与配置安全说明（验收:说明全局路径、YAML 草稿、备份、冲突检测和密钥处理；验证:`pnpm test -- --run`）
  - 验证记录: README 中英文已同步。
- [x] 4.3 执行全量质量门禁（验收:全部通过且任务基线无漂移；验证:`pnpm typecheck && pnpm -w run lint && pnpm test`）
  - 验证记录: `pnpm typecheck`、`pnpm -w run lint`、`pnpm test`、Pi 冒烟均通过；任务 id 与顺序无漂移。

## 验证记录
- `pnpm typecheck` 通过。
- `pnpm -w run lint` 通过，Biome 检查 16 个文件。
- `pnpm test` 通过：6 个测试文件、21 项测试。
- `pi -e ./src/index.ts --list-models` 成功加载扩展。
- `tasks.md` 与 `tasks.initial.md` 的任务 id 和顺序一致。
