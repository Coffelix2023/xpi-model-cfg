# xpi-model-cfg 模型配置编辑器计划

- workflowId: `xpi-fast-fix-2026-09-08-model-config-visual-editor`
- createdAt: `2026-09-08T05:29:20+08:00`
- originalRequest: 按调研与选型结论，为 `xpi-model-cfg` 规划 Glimpse 模型供应商与模型列表编辑器，并安全同步全局 `models.json`。
- planStatus: archived
- executionStatus: deferred
- planPath: `.pi/fast-fixes/2026-09-08-model-config-visual-editor/plan.md`
- tasksPath: `.pi/fast-fixes/2026-09-08-model-config-visual-editor/tasks.md`
- baselinePath: `.pi/fast-fixes/2026-09-08-model-config-visual-editor/tasks.initial.md`

## 当前状态

计划已确认并存档。任务全部处于 `pending`，业务代码尚未修改。

## 恢复说明

立即执行时运行：

```text
/xpi-fast-fix execute .pi/fast-fixes/2026-09-08-model-config-visual-editor/
```

执行时只编辑 `tasks.md`。`tasks.initial.md` 是只读基线，用于每次任务完成后核对任务 id 和顺序，禁止修改、重命名或删除。

## 阻塞记录

无。Glimpse 在 Pi 扩展运行时的模块解析路径列为第一个实现阶段任务，验证前不假设导入方式。

## 相关文件

- `plan.md`：目标、证据、选型和风险。
- `tasks.md`：可执行任务工作副本。
- `tasks.initial.md`：任务初始快照与完整性基线。
