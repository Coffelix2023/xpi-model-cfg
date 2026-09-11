# xpi-model-cfg

[English](./README.md) · **简体中文**

**Pi扩展 - 可视化面板设置LLM供应商与模型参数配置,省去编写`models.json`烦恼**

**A Pi Coding Agent extension that configures LLM providers and model parameters in a visual panel — no more hand-writing `models.json`.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

```text
> /xpi-model-cfg
```

## 为什么

`~/.pi/agent/models.json` 是手写的:缩进错一格、`compat` 键名记错、`cost` 单位搞混,都会静默地让模型行为变样;而 Pi 的 `/model` 只能读不能改。

本扩展用一个原生窗口替掉手改 JSON。面板按供应商的 `api` 类型分组,只显示该 API 真正相关的字段 —— 为 Anthropic Messages 兼容代理准备 `supportsEagerToolInputStreaming`、`forceAdaptiveThinking`、`allowEmptySignature` 这类开关时,不必先记住键名和默认值。布尔项是三态的:选「默认」就删除该键,把决定权交回 Pi 的自动探测与内置默认,绝不写死覆盖。

本仓库里的每个扩展都从同样四条规则出发:

- **没有构建步骤。** Pi 直接加载 `./src/index.ts`,没有 `dist/`、没有打包器、不提交编译产物。
- **宿主原生 UI。** 需要留在终端里的反馈走 `ctx.ui.*`;配置面板是 Glimpse 原生窗口,不劫持终端,也不引入竞争性的终端框架。
- **没有重度运行时依赖。** 唯一的运行时依赖是 `yaml`,其余只用宿主提供的 API 加严格类型。
- **门禁严格,没有例外。** TypeScript strict、Biome、Vitest 三条全绿才能提交。

它也不越界:本扩展是被 Pi 主进程加载的插件,不是独立服务。唯一的进程边界是 Glimpse 拉起的那扇原生窗口,由 `src/ui/glimpse-runtime.ts` 一处管理。

## 技术栈

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/),版本锁定在 [`mise.toml`](./mise.toml)
- [Pi Coding Agent](https://github.com/earendil-works/pi) —— 宿主本体、扩展 API 与包清单规范
- [Glimpse](https://github.com/hazat/glimpse)(`glimpseui`) —— 面板窗口的原生渲染
- [yaml](https://eemeli.org/yaml/) —— 唯一的运行时依赖,用于 `models.yml` 镜像
- TypeScript strict(`target: ES2024`,`module: NodeNext`)
- [Biome](https://biomejs.dev/) 负责 lint 与格式化
- [Vitest](https://vitest.dev/) 作为测试运行器

`@earendil-works/pi-tui` 与 `typebox` 在 `package.json` 中声明为可选 peer dependency,但当前源码没有 import:本扩展不注册 Tool,渲染也不走 pi-tui。

## 安装

前置条件:一个可用的 Pi 安装,以及能弹出原生窗口的 Glimpse。本包直接从源码加载,安装前不需要任何构建。

```bash
pi install git:github.com/Coffelix2023/xpi-model-cfg@main
```

| 安装位置 | 命令 |
| --- | --- |
| 全局(用户设置) | `pi install git:github.com/Coffelix2023/xpi-model-cfg@main` |
| 仅当前项目(`.pi/settings.json`) | `pi install -l git:github.com/Coffelix2023/xpi-model-cfg@main` |

`pi install` 写入 `~/.pi/agent/settings.json`;加 `-l` 写入项目设置,项目被信任后 Pi 会自动安装。上面指向 `main`,会被 `pi update` 移动;需要可复现的版本时,请改用具体的 commit 或 tag。

```bash
pi list                              # 已安装的包
pi update --extensions               # 更新包并校对固定的 ref
pi remove git:github.com/Coffelix2023/xpi-model-cfg
```

包级调试刻意只走 npm / git 远程源:本地路径安装只是在 settings 里留一条指向工作目录的引用,一旦忘记 `pi remove`,残留的脏路径就会和正式安装双份并存。

## 用法

| 命令 | 说明 |
| --- | --- |
| `/xpi-model-cfg` | 打开全局供应商与模型编辑器 |

### 能改什么

- **供应商**:`id`、`api`、`baseUrl`、`apiKey`、`headers`、`authHeader`,以及按 `api` 分组的 `compat` 开关。可拖放或用上下按钮排序,可新增与删除。
- **模型**:`id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、输入类型(`text` / `image`)、思考等级(`medium` / `high` / `xhigh`)、`cost`。
- **`compat`**:`api` 为 `openai-completions` 时显示 `maxTokensField` 与 `supportsUsageInStreaming`;为 `anthropic-messages` 时显示 `supportsEagerToolInputStreaming`、`supportsLongCacheRetention`、`forceAdaptiveThinking`、`allowEmptySignature`。布尔项为「默认 / true / false」三态,选「默认」即不写入该键。其余 `api` 类型不显示 `compat` 分组。

### 写入与安全边界

- 只编辑 `~/.pi/agent/models.json`,另维护两个伴生文件:`models.yml`(便于人工阅读的镜像)与 `models.json.order`(本扩展记录的供应商排序)。YAML 不是独立编辑源,也没有导入操作;不生成 `.bak.*`。
- 写入前先核对 `models.json` 是否被外部修改,一旦变化就拒绝写入;通过检查后以 `0600` 权限原子替换文件。
- 字面 API Key 与 `!command` 引用在面板和差异中掩码;`$VAR` / `${VAR}` 环境变量表达式保持原文,扩展绝不解析或执行。
- `compat` 是**合并**写回:被隐藏分组的键、以及 `openRouterRouting` 这类本面板未展示的键,都会逐字保留。
- 模型 `cost` 以每 1M token 的 CNY 为存储基准;选 USD 只换算界面显示,保存时再换回 CNY。
- 「校验」与「预览差异」不写文件。「应用」保存并保持窗口打开,「确定」保存并关闭,「取消」丢弃未应用修改。删除与保存都在面板内要求一次明确确认,保存确认会附上脱敏差异。
- 本扩展不注册任何 Tool 或 hook,也不会替你重载模型列表:应用成功后需要在 Pi 内重载才会生效。

## 开发

```bash
mise install                         # 安装锁定版本的 Node.js 与 pnpm
pnpm install
```

| 门禁 | 命令 |
| --- | --- |
| 类型 | `pnpm typecheck` —— `tsc --noEmit` |
| Lint 与格式 | `pnpm -w run lint` —— Biome 全仓检查 |
| 测试 | `pnpm test` —— Vitest(`vitest run --passWithNoTests`) |

提交前三条必须全绿。Lint 请在 workspace root 显式运行 `pnpm -w run lint`;包装层偶发会把裸写的 `pnpm run lint` 误判为未知递归命令。

开发期运行扩展有两种方式:

```bash
pi -e ./src/index.ts                 # 冒烟:只加载一次,仅本次运行,不写配置
```

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-model-cfg   # 日常回路:在 Pi 内用 /reload 热载
```

`pi -e` 不写任何设置;软链由扩展目录自动发现,`rm` 掉软链即干净。

## 目录结构

```text
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md
├── README.md / README.zh-CN.md
├── docs/                            # Git 工作流与仓库约束
└── src/
    ├── index.ts                     # 扩展入口(register 函数),注册 /xpi-model-cfg
    ├── lib/
    │   ├── models-config.ts         # 类型、校验、脱敏、应用前差异预览
    │   └── models-persistence.ts    # models.json 的原子写入
    └── ui/
        ├── glimpse-runtime.ts       # 动态加载 Glimpse,收纳 macOS 原生 stderr 噪声
        ├── model-config-panel.ts    # 面板 HTML 与内联脚本
        └── model-config-workflow.ts # 面板消息循环与落盘编排
```

## 设计规范

本项目遵循 [Google Labs DESIGN.md 规范](https://github.com/google-labs-code/design.md),并专门为终端 TUI 场景定制。详见 [`DESIGN.md`](./DESIGN.md) 查看设计 Token(颜色、等宽字阶、间距网格与组件定义)。

## 约定与约束

- **术语表**:[`CONTEXT.md`](./CONTEXT.md) 定义了本仓库的统一语言,代码、文档与提交中禁止术语漂移。
- **Git 纪律**:提交或推送前先读 [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) 与 [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md)。默认不直推 `main`,使用小粒度 Conventional Commits。
- **Token 安全**:密钥与 Token 绝不写入代码、日志、示例或文档。
- **Agent 契约**:[`AGENTS.md`](./AGENTS.md) 是本仓库的唯一事实来源。口头约定、历史代码或本 README 与它冲突时,以 `AGENTS.md` 为准。

## 致谢

- [Pi Coding Agent](https://github.com/earendil-works/pi) —— 由 [earendil-works](https://github.com/earendil-works) 开发。本扩展寄宿其中:扩展 API、`ctx.ui` 契约和包清单规范都来自该项目。
- [Glimpse](https://github.com/hazat/glimpse) —— 面板窗口的渲染与原生进程管理。本扩展按需动态加载它;加载不到时回退到用户级 Pi 包中的副本,两者都不可用时命令报错退出。

## 许可

MIT。本仓库尚未提交 `LICENSE` 文件;`package.json` 声明 `"license": "MIT"`。
