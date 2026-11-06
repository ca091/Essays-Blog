# 用飞书机器人接管 Codex：配置、会话续接与排错实录

> 整理：CQ · 2026-11-06<br>
> 官方文档：[Codex Harness](https://docs.openclaw.ai/zh-CN/plugins/codex-harness)

目标是让飞书机器人操作本机 Codex，并探索从 CLI 旧会话继续工作的方式。本次打通了连接和绑定审批，修复了两处 Feishu 插件逻辑，随后发现：**当前版本热加载会清除聊天绑定，普通 OpenClaw 也能执行 shell；收到命令结果不能单独证明 Codex 接管成功。**

本文基于 OpenClaw / Codex、Feishu 插件 `2026.10.10`，本机 CLI `0.166.0`、托管 App Server `0.167.0`。修复后的 Codex 执行闭环及旧会话续接仍待验收。

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

## 2. 配置：本机 Unix 连接与用户目录

| 方案 | 用途 |
| --- | --- |
| 默认 `stdio` + `homeScope: "agent"` | OpenClaw 管理 App Server，隔离 Agent 状态，无需手动启动 daemon |
| `stdio` + `homeScope: "user"` | 托管进程，共享本机原生账户、配置和线程 |
| **`unix` + `homeScope: "user"`** | **本次方案：连接本机 daemon，共享原生状态** |

### 终端安装与配置

在 Gateway 所在电脑执行；插件已安装时跳过安装命令：

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

配置完成后运行 `openclaw gateway restart`，再建立聊天绑定。

### 飞书需要哪些权限

| 层级 | 检查项 |
| --- | --- |
| 飞书应用 | 正确的 App ID / Secret、消息事件、发送及更新卡片权限、`card.action.trigger` 回调 |
| OpenClaw 身份 | 渠道准入、当前应用下正确的用户 Open ID、所有者身份 |
| 插件绑定 | 点击“一次允许 / 始终允许”完成接管审批 |
| Codex 执行 | 原生 sandbox、approvalPolicy 等操作策略 |

机器人由运维创建时，需要应用管理员协助配置。消息事件与卡片回调分别检查；本次长连接已实际收到回调，无需据此一律改成 Webhook。修改 Codex 审批策略也不能代替飞书应用授权。

不同应用下的用户 Open ID 可能不同，沿用旧 ID 曾导致 `open_id cross app`。“始终允许”会保留相应插件接管许可，**不代表聊天绑定会永久保留**。

## 3. 绑定与验收：前后都查 binding

在飞书中依次发送：

```text
/codex status
/codex models
/codex bind --cwd /absolute/path/to/project --model gpt-6.1-sol
/codex binding
```

完成审批并确认绑定存在后，发送只读任务：

```text
请实际执行 pwd 和 git status --short --branch，
报告工作目录和分支状态，暂时不要修改文件。
```

执行后再次发送 `/codex binding`，结合日志验收：

```text
status 可连接 → bind 获批 → binding 存在
                                 │
                                 ▼
                    普通消息确实路由到 Codex
                                 │
                                 ▼
                工具执行、飞书收到结果、原生 Thread 可核对
```

首次初始化前 Thread 可能为 `unknown`；`No Codex conversation binding is attached` 则表示未查到有效聊天绑定。验收要核对线程、工作目录和执行路由，不能只看模型名或机器人声称“已执行”。

| 控制命令 | 作用 |
| --- | --- |
| `/codex stop` | 中断当前轮次 |
| `/codex steer <补充要求>` | 引导活动轮次 |
| `/codex unbind` 或 `/codex detach` | 解除聊天绑定，不回滚文件变更 |

原生模型以 `/codex models` 的实时目录为准。OpenClaw 中设置的上下文、最大输出和推理级别，也需另查原生线程配置，不能假定自动继承。

## 4. 续接 CLI 旧会话：按线程来源选路径

```text
已有可验证 Harness 绑定 ──→ /codex resume <thread-id>
CLI/Desktop 原生旧线程 ───→ 优先监督或 fork 后继续
其他机器的线程 ───────────→ 先确认节点及远程执行能力
```

### 恢复符合条件的绑定

```text
/codex threads 项目关键词
/codex resume <thread-id>
/codex binding
```

官方文档说明，无既有可验证绑定的线程首次接管，需要本地 stdio、每 Agent 的 Codex home，且目标线程空闲。因此，本次 `unix + user home` 方案不能保证任意 CLI 旧线程都能直接 resume。

### 监督：作为分支继续

在 Control UI 的 Codex 目录选择本机会话的“作为分支继续”，或在**终端**执行：

```bash
openclaw codex sessions --host gateway:local --search 项目关键词 --json
openclaw codex continue <thread-id> --json
```

它创建受监督聊天，不会自动切换当前飞书私聊。按查阅时的文档，历史镜像最多 200 条用户/助手消息、总计 512 KiB、单条 64 KiB；源推理、工具调用与结果不会完整迁入。没有 `/codex continue` 聊天命令。

### 普通所有者会话：使用 codex_threads

用户目录模式可通过 `codex_threads` 读取、fork 并关联线程。启用监督后，Agent 读取原始记录需 `supervision.allowRawTranscripts`，相应线程变更需 `supervision.allowWriteControls`；**本次两项均未开启**。

在提供该工具的普通所有者会话中，可以要求：

```text
请读取线程 <thread-id>，核对项目目录和最后任务；
确认后 fork 并关联当前会话，保留源线程。
先汇报继承的任务与待办，暂时不要修改文件。
```

原生 `/codex bind` 入口不保证提供同一组 OpenClaw 管理工具。独立 App Server 进程也不协调同一线程的并发写入；接续前确认源轮次已结束，优先创建分支。

## 5. 三个实际问题

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

**原因：**本次版本将 Feishu 聊天绑定保存在内存 Map 中，管理器 `stop()` 会清空该账号的记录。实际代码复现确认，即使关闭超时，停止再启动后绑定也会消失。

```text
18:13  bind 成功
18:23  热加载 Feishu → 停止管理器 → 清除绑定
18:24  普通消息走 OpenClaw，执行 shell 并回复
18:29  /codex binding → No Codex conversation binding is attached
```

**处理：重载或重启后重新 bind，再按第 3 节验收。**此前“无需重新绑定”的判断有误；这次 shell 回复不能用于证明 Codex 接管成功。“始终允许”保留的是审批许可，与内存绑定是两回事。

## 6. 补丁位置与维护

两处补丁修改的是本机 **Feishu 插件编译产物**：

```text
~/.openclaw/npm/projects/<安装代次>/node_modules/
  @openclaw/feishu/dist/.setup/monitor.account-DIvDEG0X.mjs
```

上游源码：[openclaw/openclaw · extensions/feishu/src](https://github.com/openclaw/openclaw/tree/main/extensions/feishu/src)。安装前校验了目标哈希并保留相邻备份；包路径和编译文件名会随版本变化，升级可能覆盖补丁。

更新后检查上游修复情况、重跑回归，并重新绑定验收。当前未修改绑定的持久化机制；卡片流式更新、工具进度播报也不在这两处补丁范围内。

## 7. 当前结论

| 项目 | 验证状态 |
| --- | --- |
| App Server 连接、卡片审批 | 已有真实成功记录 |
| 两处 Feishu 逻辑补丁 | 已部署，16 项代码级回归通过 |
| 重载清除聊天绑定 | 已由日志与管理器代码复现确认 |
| Codex 执行与回复闭环 | 需重新绑定后验收；已有 shell 回复走的是普通 OpenClaw |
| CLI 旧会话接续、原生模型参数 | 尚未完整实测 |

## 参考资料

- [Codex Harness](https://docs.openclaw.ai/zh-CN/plugins/codex-harness)
- [Codex Harness 配置参考](https://docs.openclaw.ai/zh-CN/plugins/codex-harness-reference)
- [Codex 会话监督](https://docs.openclaw.ai/zh-CN/plugins/codex-supervision)
- [飞书高级配置](https://docs.openclaw.ai/channels/feishu/advanced-configuration)

查阅时中文文档仍列出较旧的 App Server 版本范围，排查应同时核对安装版与实际启动日志。文中的内存绑定、补丁及验证结论仅针对本次版本。
