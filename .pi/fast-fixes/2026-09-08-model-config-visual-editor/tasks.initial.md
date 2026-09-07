# 任务初始只读基线

> 只读基线，禁止修改；用于与 `tasks.md` 对比检测任务遗漏。

- workflowId: `xpi-fast-fix-2026-09-08-model-config-visual-editor`
- createdAt: `2026-09-08T05:29:20+08:00`
- originalRequest: 按调研与选型结论，为 `xpi-model-cfg` 规划 Glimpse 模型供应商与模型列表编辑器，并安全同步全局 `models.json`。
- planStatus: archived
- executionStatus: deferred

## 1. 配置契约与解析
- [ ] 1.1 定义 models.json/models.yml 类型与字段分组（验收:覆盖 provider、model、modelOverrides、samplingParams、cost、compat，并允许未知字段保留；验证:`pnpm typecheck`）
- [ ] 1.2 实现 JSON/YAML 导入、镜像导出、脱敏与哈希计算（验收:解析失败拒绝、引用原样保留、敏感值不进入日志；验证:`pnpm test -- --run src/lib/models-config.test.ts`）

## 2. 安全写入
- [ ] 2.1 实现校验、外部变更检测、脱敏 diff 与确认前数据结构（验收:基线哈希变化时阻止应用；验证:`pnpm test -- --run src/lib/models-config.test.ts`）
- [ ] 2.2 实现备份、0600 临时文件与原子替换（验收:写入失败保留原文件，成功后生成备份且 JSON 可解析；验证:`pnpm test -- --run src/lib/models-persistence.test.ts`）

## 3. Glimpse 面板
- [ ] 3.1 验证 Glimpse 在 Pi 扩展中的运行时解析路径（验收:不硬编码开发机绝对路径，Glimpse 不可用时扩展仍能加载；验证:`pi -e ./src/index.ts`）
- [ ] 3.2 实现 Provider 列表、Model 编辑、敏感字段掩码与高级字段区（验收:支持核心字段，未知字段可查看/保留，支持键盘确认与取消；验证:`pnpm test -- --run src/ui/model-config-panel.test.ts`）
- [ ] 3.3 实现 Import、Validate、Preview Diff、Apply、Cancel 工作流（验收:Apply 只能通过显式确认触发，状态和错误可见；验证:`pnpm test -- --run src/ui/model-config-panel.test.ts`）

## 4. Pi 接入与文档
- [ ] 4.1 将面板接入 /xpi-model-cfg 命令并处理通知/关闭/异常状态（验收:命令可启动面板，取消不改文件，异常不导致扩展退出；验证:`pi -e ./src/index.ts`）
- [ ] 4.2 更新 README 与配置安全说明（验收:说明全局路径、YAML 草稿、备份、冲突检测和密钥处理；验证:`pnpm test -- --run`）
- [ ] 4.3 执行全量质量门禁（验收:全部通过且任务基线无漂移；验证:`pnpm typecheck && pnpm -w run lint && pnpm test`）
