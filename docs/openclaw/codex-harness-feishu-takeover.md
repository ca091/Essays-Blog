# 用飞书机器人接管 Codex：配置、会话续接与排错实录

> 整理：CQ · 2026-11-06；续接补充：2026-11-12<br>
> 官方文档：[Codex Harness](https://docs.openclaw.ai/zh-CN/plugins/codex-harness)

目标是让飞书机器人操作本机 Codex，并从已有原生线程继续工作。11 月 6 日打通连接和绑定审批、修复两处 Feishu 插件逻辑；11 月 12 日进一步确认：**普通本地 `resume` 的 session 关联与 `bind` 的飞书聊天接管分属两层。当前飞书私聊指定旧线程的实测入口是单行 `/codex bind <thread-id> --cwd /absolute/path/to/project`。**

| 记录时间 | 环境与证据边界 |
| --- | --- |
| 11 月 6 日历史基线 | OpenClaw / Codex、Feishu 插件 `2026.10.10`；CLI `0.166.0`、托管 App Server `0.167.0`；采用本机 Unix 连接与用户目录方案 |
| 11 月 12 日补充检查 | 本机 OpenClaw 与 `@openclaw/codex` 安装包均为 `2026.10.10`，有历史补丁背景；终端 CLI 为 `0.167.0` |

终端 CLI 版本不能证明正在运行的 daemon / App Server 版本；11 月 12 日未重新读取其配置和版本。下文分别标明历史实录、当天实测、安装实现说明与待验收项，不能据此保证任意已有原生线程都可直接接管。**原生工具执行 → 飞书交付的完整闭环仍待验收。**

## 1. 接管链路

```text
飞书用户
   │ 消息、命令、卡片点击
   ▼
Feishu 插件 + OpenClaw Gateway
   │ 用户身份、渠道准入、绑定审批、回复交付
   ▼
Codex 插件 → Codex App Server → 原生线程与项目工具
   │
   └──────────── 执行结果 → 飞书
```

Harness 负责线程、工具调用和执行生命周期。模型、运行时与聊天渠道分别配置；仅把模型改成 GPT，不会自动启用 Codex Harness。

### 两层绑定与项目工作区

**安装实现说明：**普通本地 `resume` 使用 session identity；`bind` 与 `binding` 使用 conversation identity。两种绑定有不同的身份和生命周期，即使存放在同一插件状态命名空间，也不能互相替代查询。

```text
聊天接管（/codex bind）
  飞书 conversation → conversation binding → Codex 原生 thread
                           ↑
                  /codex binding 查询此层

session 关联（普通本地 /codex resume）
  OpenClaw session → session binding → Codex 原生 thread

项目 cwd → Git 分支、工作区文件与未提交改动（另一个维度）
```

接管对象是保存对话历史的 Codex 原生 thread。接管条件取决于所选连接能否访问线程、owner、工具目录及运行配置。线程分叉、聊天接管、Git 分支和 worktree 是不同操作；绑定不会自动隔离文件。

## 2. 配置：本机 Unix 连接与用户目录

| 方案 | 用途 |
| --- | --- |
| 默认 `stdio` + `homeScope: "agent"` | OpenClaw 管理 App Server，隔离 Agent 状态，无需手动启动 daemon |
| `stdio` + `homeScope: "user"` | 托管进程，共享本机原生账户、配置和线程 |
| **`unix` + `homeScope: "user"`** | **11 月 6 日方案：连接本机 daemon，共享原生状态** |

### 终端安装与配置

以下为 11 月 6 日配置记录，在 Gateway 所在电脑执行；已有环境先核对实际配置，插件已安装时跳过安装命令：

```bash
openclaw plugins install @openclaw/codex
codex app-server daemon start
codex app-server daemon status
```

将以下片段合并到 `~/.openclaw/openclaw.json`，保留已有插件和所有者：

```json5
{
  commands: {
    ownerAllowFrom: ["feishu:ou_YOUR_OPEN_ID"]
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "unix",
            homeScope: "user"
          },
          supervision: { enabled: true }
        }
      }
    }
  }
}
```

- 若已有 `plugins.allow`，追加 `codex`。
- Unix 连接双方应使用同一 `$CODEX_HOME`，未设置时为 `~/.codex`，并使用其中已有的原生认证。
- 默认隔离方案可按官方流程运行 `openclaw models auth login --provider openai`。
- `supervision.enabled` 用于旧会话监督，新建绑定不强制要求开启。

11 月 6 日配置后曾运行 `openclaw gateway restart`。已有环境按安装版流程应用配置变更后，先检查连接与聊天绑定状态，再决定是否需要建立绑定；重启不作为释放 owner 的手段。

### 飞书需要哪些权限

| 层级 | 检查项 |
| --- | --- |
| 飞书应用 | 正确的 App ID / Secret、消息事件、发送及更新卡片权限、`card.action.trigger` 回调 |
| OpenClaw 身份 | 渠道准入、当前应用下正确的用户 Open ID、所有者身份 |
| 插件绑定 | 点击“一次允许 / 始终允许”完成接管审批 |
| Codex 执行 | 原生 sandbox、approvalPolicy 等操作策略 |

机器人由运维创建时，需要应用管理员协助配置。消息事件与卡片回调分别检查；11 月 6 日长连接已实际收到回调，无需据此一律改成 Webhook。修改 Codex 审批策略也不能代替飞书应用授权。

不同应用下的用户 Open ID 可能不同，沿用旧 ID 曾导致 `open_id cross app`。“始终允许”会保留相应插件接管许可，**不代表聊天绑定会永久保留**。

## 3. 绑定与验收：区分回执、初始化和执行

### 新线程与旧线程使用不同入口

前提是具备 owner / admin 权限，源任务已结束，没有其他客户端正向同一线程写入，并且连接、工具目录与原生配置允许接管。先查询 `/codex status`、`/codex models`；接旧线程还要用 `/codex threads 项目关键词` 核对 ID、工作目录和可见状态，并确认所选连接使用的 Codex home 能访问目标线程，不能只看标题。

以下命令分别作为**一条单行飞书消息**发送，二选一：

```text
/codex bind --cwd /absolute/path/to/project --model <model-from-codex-models>
```

不带 ID：下一条消息创建新原生线程。指定旧线程接管当前飞书聊天，本次实测使用：

```text
/codex bind <thread-id> --cwd /absolute/path/to/project
```

**11 月 12 日实测：**显式目录的单行命令返回 `Bound this conversation … The next message will initialize it.`。这只确认接管请求已建立；按实际出现的审批卡片完成授权，再查 `/codex binding`。历史“始终允许”不代表聊天绑定永久存在。

接管示例显式填写 `--cwd` 并核对回执中的目录；它不选择 Codex home、不复制线程，也不解除已有 owner。当天未填写 cwd 的一次回执落到了 OpenClaw 默认目录，而非目标项目。

### 看懂 binding 的阶段

**11 月 12 日实测：**同一个 conversation Binding ID 的三次查询如下，旧线程匿名记作 A：

| 时间 | Thread | Workspace | Model | Active run |
| --- | --- | --- | --- | --- |
| 14:31 | `unknown` | 正确项目目录 | `default` | `none` |
| 14:33 | 旧线程 A | 正确项目目录 | `gpt-6.1-sol` | `none` |
| 14:36 | 旧线程 A | 正确项目目录 | `gpt-6.1-sol` | `none` |

**安装实现说明：**`unknown` 表示聊天接管记录存在，但尚未读到其原生 thread binding；`default` 也可能是未读到原生 model 的显示回退。`Active run: none` 仅表示当前 conversation 未跟踪到活动轮次。**Thread ID 与 Binding ID 不是同一种 ID。**

记录未完整展示 14:31→14:33 之间的初始化输入和原生执行证据，不能写成“等两分钟自动完成”，也不能据此认定已执行工具任务。看到 `unknown` 时先排查初始化阶段，不立即重复 bind。

### 真实执行闭环怎么验收

下面是**建议补做的验收流程，本次尚未完整完成**：

```text
bind 回执 / 审批通过
         │ /codex binding：接管记录与 cwd 正确
         ▼
发送一条只读普通任务 ──→ 后续初始化、工具与配置校验
         │
         ▼
核对实际 Thread ID ──→ 确认仍是请求接管的旧线程
         │
         ▼
核对原生 thread / turn / 工具执行归属 ──→ 飞书收到对应结果
```

可发送以下单行任务：

```text
请只执行 pwd 和 git status --short --branch，报告工作目录、分支和未提交改动，不修改文件；并说明本次使用的原生 Codex thread ID。
```

随后再查 `/codex binding`，用原生线程记录或日志核对这条请求、turn 和执行结果的归属。模型口头声称使用 Codex、模型名正确、出现 shell 输出或 `Active run: none`，都不能单独证明路由成功。

**安装实现说明：**普通非 `runtime.networkProxy` 的 conversation 路径会对指定旧 ID 调用 `thread/resume`；启用该策略的分支可能改走 `thread/start`。因此必须比较初始化后的实际 Thread ID；本轮没有实测启用 networkProxy，也不把 bind 回执当成所有策略下同线程恢复的保证。

遇到工具目录不匹配、首次接管条件不满足、active owner 冲突、原生父线程控制、目录不符或配置应用无法确认时，停止尝试，保留原线程并报告阻塞，不自动删绑定或静默换新线程。

| 控制命令 | 作用与边界 |
| --- | --- |
| `/codex stop` | 中断当前轮次，不等于释放所有 owner |
| `/codex steer <补充要求>` | 引导活动轮次 |
| `/codex unbind` 或 `/codex detach` | 解除当前聊天接管；已初始化时尝试退休该 conversation 的原生绑定，不回滚文件，也不代表清除了其他 session owner |

原生模型以 `/codex models` 的实时目录为准。OpenClaw 中设置的上下文、最大输出和推理级别，也需另查原生线程配置，不能假定自动继承。

## 4. 续接旧会话：按目标选路径

```text
希望怎样继续？
  ├─ 当前飞书继续同一旧线程 ──→ /codex bind <thread-id> --cwd <绝对路径>
  ├─ 保留 A，创建原生新线程 B ─→ 终端 codex fork <thread-id>
  ├─ 创建独立受监督 Chat ─────→ Control UI「作为分支继续」/ operator CLI
  └─ 线程位于其他机器 ───────→ 核对节点能力，再走远端续接
```

### 同一旧线程接管当前飞书

按第 3 节使用指定 ID 的单行 bind。如果此前做过普通 resume、遇到 owner 冲突或切换过 session 生命周期，应先只读检查 session 与 conversation owner；仅查 `/codex binding` 不够，详见第 5 节。

**11 月 12 日实测：**普通本地命令与紧随的查询返回：

```text
/codex resume <thread-id>
→ Attached this OpenClaw session to Codex thread …
  The next turn will validate its tools and apply this session's configuration …

/codex binding
→ No Codex conversation binding is attached.
```

**安装实现说明：**前者保存 session 级线程关联，后者查 conversation 级接管。两条回执可以同时成立；当天这段过程未发现重启或重载证据，不能套用“热加载丢绑定”的解释。本机普通本地 resume 路径也未发现“已有 conversation 就自动更新它”的分支。

首次 resume 无既有可验证 Harness 绑定的线程，安装版文档仍要求本地 `stdio`、每 Agent 的 Codex home、目标线程空闲，并在下一轮校验动态工具目录及配置。11 月 6 日的 `unix + user home` 方案不保证任意原生旧线程都能接管；11 月 12 日 bind 查询成功也不代表上述执行条件已全部通过。

### 保留源线程：终端原生 fork

**命令说明，尚未实际 fork：**本机 `0.167.0` 的帮助确认以下入口；[OpenAI CLI 参考](https://developers.openai.com/codex/cli/reference/#codex-fork)也说明 fork 会保留原会话并创建新聊天。

```bash
codex fork <thread-id>
```

它进入交互式分叉会话，不是立即输出 JSON 新 ID 的接口。不想提交新任务时，不追加 `[PROMPT]`。也可用 `codex fork` 打开选择器、`codex fork --all` 跨目录选择，或 `codex fork --last` 分叉最近会话。

```text
原生线程 A ── codex fork ──→ 原生线程 B（新 ID）
                                  │ 核验实际 ID、目录和工具兼容性
                                  ▼
                           另行绑定当前飞书聊天

A 与 B 共享 cwd？ ── 是 ──→ 仍操作同一份文件
并行开发需要文件隔离 ──────→ 另行规划 Git 分支 / worktree / 目录
```

不要把自然语言 prompt 当作历史复制机制。OpenClaw 飞书没有 `/codex fork` 聊天命令；`codex_threads(action="fork", attach=…)` 是另一个 Agent 工具入口，需在实际提供该工具的会话中使用。启用监督后，原始记录读取受 `supervision.allowRawTranscripts` 约束，fork 等变更受 `supervision.allowWriteControls` 约束；11 月 6 日记录中两项均未开启，不能默认现在已获许可。

新线程 B 仍可能不满足 Harness 工具目录要求。先取得实际 B ID，再独立检查接管条件，不能默认任意 CLI fork 都能绑定飞书。

### 独立受监督 Chat：作为分支继续

**安装版文档说明：**在 Control UI 的 Codex 目录选择本机会话的“作为分支继续”，或在**终端**执行：

```bash
openclaw codex sessions --host gateway:local --search 项目关键词 --json
openclaw codex continue <thread-id> --json
```

该路径创建受监督 Chat，首次发送消息才物化主分支，**不会自动切换当前飞书私聊**。它镜像有界的用户 / 助手可见历史：最多 200 条消息、总计 512 KiB、单条 64 KiB；不会完整复制源 reasoning、工具调用和结果。受监督 Chat 有模型锁定与绑定生命周期限制，不能当作普通 bind 的替代入口。没有 `/codex continue` 聊天命令。

### 远端节点：单独核对能力

**文档说明，本次未验收：**带 `--host … --bind here` 的 resume 是远端分支，会绑定当前聊天，不能由普通本地路径泛化为“resume 永远只改 session”。

```text
/codex sessions --host <node> 项目关键词
/codex resume <session-id> --host <node> --bind here
```

需 `operator.admin`，节点已连接，并实际声明且允许 `codex.appServer.threads.list.v1`、`codex.appServer.thread.turns.list.v1` 与 `codex.cli.session.resume`；还要满足 Gateway 命令 allowlist 和来源兼容条件。仅能浏览目录或打开远端终端，不代表能续接 Chat。安装版文档的 paired-node Chat 续接要求源使用本地 stdio；Unix / WebSocket 来源可浏览不代表可按此路径续接。

## 5. 排错实录：先判断是哪一层

以下问题一至三为 **11 月 6 日历史实录**；两处补丁、16 项回归和重载复现未在 11 月 12 日重新验证。

### 问题一：授权按钮变成了普通聊天文本

**现象：**点击允许后，机器人把 `pluginbind:<id>:o` 当成聊天内容交给模型。

**原因：**卡片回调已到达，但 Feishu 合成命令分发器缺少绑定审批分支。

**修复：**在 `dispatchSyntheticCommand(params)` 开头解析审批命令，交给官方 SDK 处理后返回：

```js
import {
  buildPluginBindingResolvedText,
  parsePluginBindingApprovalCustomId,
  resolvePluginConversationBindingApproval
} from "openclaw/plugin-sdk/conversation-runtime";

const approval = parsePluginBindingApprovalCustomId(params.command);
if (approval) {
  const senderId = params.event.operator.open_id?.trim();
  if (!senderId) throw new Error("Verified Feishu sender required");

  const resolved = await resolvePluginConversationBindingApproval({
    approvalId: approval.approvalId,
    decision: approval.decision,
    senderId
  });
  await sendMessageFeishu({
    cfg: params.cfg,
    to: resolveCallbackTarget(params.event),
    text: buildPluginBindingResolvedText(resolved),
    accountId: params.accountId
  });
  return;
}
```

以上省略了本地补丁中的结果日志。8 项代码级测试通过，真实日志也确认 `allow-always: approved`。

### 问题二：绑定成功，普通消息被直接忽略

**现象：**消息约 32 毫秒就结束，日志为 `completed:plugin-bound-handled`、`replies=0`。

**原因：**Feishu 只为命令计算授权；Codex 绑定入口却对所有消息检查：

```js
if (event.commandAuthorized !== true) return { handled: true };
```

**修复：**检测到运行时绑定时，也调用原有授权解析；私聊不能复用未请求命令授权的早期缓存。核心条件如下，变量为便于阅读的等价展开：

```js
const needsAuthorization =
  hasRuntimeConversationBinding ||
  (audioTranscript === undefined
    ? effectiveShouldComputeCommandAuthorized
    : core.channel.commands.shouldComputeCommandAuthorized(
        effectiveCommandProbeBody, effectiveCfg
      ));

const canReuseEarlyDmAuthorization =
  isDirect &&
  audioTranscript === undefined &&
  effectiveDmIngress &&
  !hasRuntimeConversationBinding;
```

`hasRuntimeConversationBinding` 初始为 `false`，发现 `runtimeRoute.bindingRecord` 时设为 `true`。其余 DM/群聊授权调用保持原逻辑，未授权用户仍被拦截。

新增 8 项回归通过，连同卡片回归共 **16 项通过**。这是代码边界验证，不等于真实模型执行与飞书交付已验收。

### 问题三：重载后能执行命令，binding 却显示未绑定

**原因：**11 月 6 日所查实现将 Feishu 聊天绑定保存在内存 Map 中，管理器 `stop()` 会清空该账号的记录。实际代码复现确认，即使关闭超时，停止再启动后绑定也会消失。

```text
18:13  bind 成功
18:23  热加载 Feishu → 停止管理器 → 清除绑定
18:24  普通消息走 OpenClaw，执行 shell 并回复
18:29  /codex binding → No Codex conversation binding is attached
```

**处理：重载或重启后先查 `/codex binding`。**若聊天绑定确已丢失，先核对原线程 owner；要继续原线程时，用其 ID 和显式 cwd 重建接管，再按第 3 节验收。不要省略 ID 而误建新线程。已有绑定则先核对其线程与目录，不重复 bind。这次 shell 回复不能证明 Codex 接管成功；“始终允许”保留的是审批许可，与内存绑定是两回事。

### 问题四：resume 成功，binding 却为空

**11 月 12 日实测与实现核对：**这是 session 关联与 conversation 接管查询不同层的独立问题，见第 4 节。`No Codex conversation binding is attached` 不能证明 resume 失败，也不能证明全局无 owner。先确定接管目标，再查对应身份，不能一律归因于热加载。

### 问题五：粘贴命令返回 Usage，或目录不符

**11 月 12 日实测：**把 shell 的反斜杠续行形式粘到飞书返回 Usage；改为单行 bind 后得到成功回执。飞书示例不要用 shell 换行。未传 `--cwd` 的一次绑定使用了默认目录，之后应始终显式填写并核对绝对路径，不能假定旧 ID 会自动选中目标项目。

### 问题六：看似空闲，却仍有 owner；reset / unbind 释放了吗

先分清三种状态：

| 观察 | 能确认 | 不能确认 |
| --- | --- | --- |
| 原生线程 `notLoaded` | 当前查询连接的 App Server 没加载它；线程仍可保存在目录中 | 其他进程空闲、没有 OpenClaw owner |
| 插件绑定 `state: active` | 有效绑定记录仍持有对应线程的 owner | 一定正在生成或执行工具 |
| `/codex binding` 的 Active run: none | 当前 conversation 未跟踪到活动轮次 | 没有其他 session owner 或独立客户端活动 |
| `/codex binding` 显示未绑定 | 当前 conversation 没有对应接管记录 | 所有 session owner 已释放 |
| `/codex threads` 仍列出旧线程 | 原生目录仍能发现它 | owner 清理成功或失败 |

**11 月 12 日实测时间线：**

```text
较早：/reset soft ──→ 只读检查仍是同代 session，绑定 state: active
         │ 不能当成已释放 owner
         ▼
14:25：/new 之后 ───→ 只读检查确认旧线程 A 没有 active OpenClaw owner
         │ 只是该时点的快照，不证明 /new 在所有场景必然释放
         ▼
14:30–14:36：bind ──→ binding 后续显示旧线程 A 与正确项目目录
         ▼
14:36：unbind ──────→ 当前 conversation 查询为空
                       未再次全局查 owner，不能复用 14:25 的结论
```

14:25 的检查同时确认旧线程 A 存在、状态为 `notLoaded`；绑定命名空间、conversation 记录、当前 session 元数据和兼容旧 sidecar 中未发现 A 的残留 owner 引用。检查没有通过 bind / resume 或修改数据库来试探可用性，也不据此断言 `/new` 必然更换 session ID。

**安装实现说明：**本机 `session_end` 监听处理 `new / reset / idle / daily`，但 `nextSessionId === sessionId` 时跳过退休。因此 soft reset 的这次观察不能扩大成“所有版本 reset 都不清理”；任一 reset、new 或 unbind 回执也都不是“所有旧关联已清理”的证明。

### 维护者如何只读核对 owner

先查安装实现的命名空间与过滤语义，再读权威绑定记录。本机 `hasOtherThreadOwner` 按有效记录的 `state === "active"` 与 `binding.threadId` 精确匹配判定其他 owner，排除当前身份；不以 active run 判断。

- 状态库默认是 `~/.openclaw/state/openclaw.sqlite`；表为 `plugin_state_entries`，插件为 `codex`，命名空间为 `app-server-thread-bindings`。
- 使用只读连接，例如 Python 的 `Path(db).as_uri() + '?mode=ro'` 配合 `uri=True`；不调用迁移或修复入口。
- 覆盖完整命名空间，区分 session / conversation 身份；结合 `expires_at` 与实际 store 过滤规则，不能将过期原始行直接算作有效 owner。
- 命中 session owner 时，再对照所属 agent 库的 `session_nodes.current_session_id`、`session_windows` 核对代际；仅在安装实现仍兼容时检查旧 sidecar。

下面只是参数化只读查询形状，`?` 绑定目标 thread ID；查询结果还需按上述规则解释：

```sql
SELECT entry_key,
       json_extract(value_json, '$.state') AS state,
       json_extract(value_json, '$.sessionId') AS session_id,
       expires_at
FROM plugin_state_entries
WHERE plugin_id = 'codex'
  AND namespace = 'app-server-thread-bindings'
  AND json_extract(value_json, '$.binding.threadId') = ?;
```

发现冲突或无法解释的记录时停止绑定尝试。不要用 SQL UPDATE / DELETE、删库、删 sidecar、归档线程或重启试运气来释放 owner；也不要读取原始聊天 transcript 代替 owner 元数据核对。

## 6. 补丁位置与维护

11 月 6 日的两处补丁修改的是本机 **Feishu 插件编译产物**：

```text
~/.openclaw/npm/projects/<安装代次>/node_modules/
  @openclaw/feishu/dist/.setup/monitor.account-DIvDEG0X.mjs
```

上游源码：[openclaw/openclaw · extensions/feishu/src](https://github.com/openclaw/openclaw/tree/main/extensions/feishu/src)。安装前校验了目标哈希并保留相邻备份；包路径和编译文件名会随版本变化，升级可能覆盖补丁。

插件更新后检查上游修复情况、重跑回归，并核对现有绑定；仅在聊天绑定丢失且 owner 条件允许时按原线程 ID 重建接管，再验收。上述历史补丁未修改绑定持久化机制；卡片流式更新、工具进度播报也不在两处补丁范围内。

## 7. 当前结论

| 项目 | 证据与验证状态 |
| --- | --- |
| App Server 连接、卡片审批 | 11 月 6 日已有真实成功记录 |
| 两处 Feishu 逻辑补丁 | 11 月 6 日已部署，16 项代码级回归通过；本轮未重跑 |
| 重载清除聊天绑定 | 11 月 6 日日志与管理器代码已复现；不能解释所有 binding 为空的情况 |
| 普通本地 resume 与 conversation bind | 11 月 12 日回执及本机实现确认是两层关联；远端 resume 分支另论 |
| 目标旧线程与 owner | 11 月 12 日确认线程存在；14:25 在 /new 后只读确认没有 active OpenClaw owner，仅为当时快照 |
| 指定旧线程的飞书聊天绑定 | 11 月 12 日单行 bind + 显式 cwd 成功，后续 binding 显示正确旧 Thread ID、目录与模型 |
| unbind 后状态 | 11 月 12 日当前 conversation 查询为空；解绑后的全局 owner 未再次检查 |
| 原生 fork、监督 Chat、远端续接 | 已核对命令 / 文档语义，本次未完成实际执行验收 |
| 原生工具执行 → 飞书交付闭环、原生模型参数 | 仍待按 thread / turn / 工具执行归属核对；绑定回执与 shell 回复不足以代替验收 |

## 参考资料

- [Codex Harness](https://docs.openclaw.ai/zh-CN/plugins/codex-harness)
- [Codex 命令与诊断](https://docs.openclaw.ai/plugins/codex-harness/commands)
- [Codex Harness 配置参考](https://docs.openclaw.ai/zh-CN/plugins/codex-harness-reference)
- [Codex 会话监督](https://docs.openclaw.ai/plugins/codex-supervision)
- [OpenAI Codex CLI：fork](https://developers.openai.com/codex/cli/reference/#codex-fork)
- [飞书高级配置](https://docs.openclaw.ai/channels/feishu/advanced-configuration)

11 月 12 日实现核对来自本机安装版命令文档及 Codex 插件的 `bindConversation`、`describeConversationBinding`、`resumeThread`、`detachConversation`、`hasOtherThreadOwner`、`session_end` 与 conversation 初始化分支。编译文件名和行号会随升级改变，不作为通用补丁路径。私有线程 ID、项目路径及绑定标识均已改用占位符，完整聊天和数据库记录不随文发布。

11 月 6 日查阅的中文文档曾列出较旧的 App Server 版本范围；排查应同时核对安装版文档与实际启动日志。历史补丁、内存绑定及本机策略分支的结论均限定于所查环境，不作为其他版本的保证。
