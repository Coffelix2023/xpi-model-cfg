# GITHUB-GUARD

本文件只描述 `demo` 的仓库级 GitHub 约束。

- 仓库级 Git / GitHub 通用流程见：`docs/GIT-WORKFLOW.md`
- 当前仓库阶段、ruleset、发布入口都在这里说明

## 当前阶段

- `demo` 目前按**阶段一**处理：单人快速迭代优先。
- 默认不创建 Git 分支，直接在当前分支进行小粒度提交；只有用户明确要求时才创建分支。
- 无远端同步目标时只做本地 Git 操作；存在远端时仍需先按通用流程检查并 fetch。
- 如果以后用户明确要求进入阶段二，再切换到“分支 + PR + 人工合并”的协作流。
- 不强推、不删分支、不改 GitHub ruleset / branch protection / 仓库 settings。
- 不绕过 git hooks。
- 不把密钥 / Token 写入代码、日志、示例、文档。
- `.github/` 目录的变更必须先告知用户。

## 当前规则状态

- `guard-main` 只保留最小防线：`Block force pushes`、`Restrict deletions`。
- bypass 留空。
- 发布相关约束先按仓库现状执行，未配置 release-please。

## 切到阶段二的条件

当仓库满足以下条件时，再切换：

1. CI 已在 `main` 上稳定通过。
2. 用户显式要求进入更严格的协作流。
3. 再开启：
   - `Require a pull request before merging`
   - `Require status checks to pass`
4. 之后再把 `guard-main.json` 同步回仓库。

## 说明

- 这份文件只放仓库级判断，不重复写详细操作手册。
- 详细步骤统一看 `docs/GIT-WORKFLOW.md`。
