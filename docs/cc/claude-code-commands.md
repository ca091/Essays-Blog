# Claude Code 命令大全

> 📅 创建时间：2026-03-02
> 👤 作者：CQ

---

## 二、会话管理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/sessions` | 查看会话历史 | `/sessions` |
| `/resume` | 恢复之前的会话 | `/resume <session-id>` |
| `/clear` | 清除当前会话 | `/clear` |
| `/export` | 导出会话 | `/export > session.md` |

---

## 三、权限模式切换

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **Normal Mode** | 默认模式，每次编辑需确认 | 日常开发 |
| **Auto-Accept Mode** | 自动接受编辑 | 信任的大批量修改 |
| **Plan Mode** | 只读分析，不修改文件 | 代码审查、规划 |
| `Shift+Tab` | 循环切换模式 | - |

---

## 四、官方插件命令

### 4.1 Git 工作流 (`commit-commands`)

| 命令 | 说明 |
|------|------|
| `/commit-commands:commit` | 提交更改并生成 commit message |
| `/commit-commands:push` | 推送到远程仓库 |
| `/commit-commands:pr` | 创建 Pull Request |

### 4.2 代码审查 (`pr-review-toolkit`)

| 命令 | 说明 |
|------|------|
| `/pr-review:review` | 审查 PR 代码 |
| `/pr-review:security` | 安全检查 |
| `/pr-review:performance` | 性能分析 |

### 4.3 LSP 代码智能

| 插件 | 功能 |
|------|------|
| `typescript-lsp` | TypeScript 类型检查、跳转定义 |
| `python-lsp` | Python 代码智能 |
| `gopls-lsp` | Go 代码智能 |

---

## 五、Everything Claude Code 命令

### 5.1 核心开发命令

| 命令 | 说明 | 使用场景 |
|------|------|---------|
| `/plan` | 功能实现规划 | 开发新功能前 |
| `/tdd` | 测试驱动开发 | 先写测试再实现 |
| `/code-review` | 代码质量审查 | 提交前审查 |
| `/build-fix` | 修复构建错误 | npm build 报错时 |
| `/refactor-clean` | 死代码清理 | 清理未使用代码 |
| `/e2e` | E2E 测试生成 | 生成 Playwright 测试 |

### 5.2 包管理器命令

| 命令 | 说明 |
|------|------|
| `/setup-pm` | 配置包管理器 (npm/pnpm/yarn/bun) |

### 5.3 Go 语言命令

| 命令 | 说明 |
|------|------|
| `/go-review` | Go 代码审查 |
| `/go-test` | Go TDD 工作流 |
| `/go-build` | 修复 Go 构建错误 |

### 5.4 持续学习命令

| 命令 | 说明 |
|------|------|
| `/instinct-status` | 查看已学习的直觉模式 |
| `/instinct-import <file>` | 导入他人的直觉配置 |
| `/instinct-export` | 导出你的直觉供分享 |
| `/evolve` | 将相关直觉聚类到技能中 |
| `/skill-create` | 从 git 历史生成技能 |

### 5.5 PM2 多服务命令

| 命令 | 说明 |
|------|------|
| `/pm2` | PM2 进程管理 |
| `/multi-plan` | 多服务规划 |
| `/multi-execute` | 多服务执行 |
| `/multi-backend` | 后端服务管理 |
| `/multi-frontend` | 前端服务管理 |
| `/multi-workflow` | 多服务工作流 |

---

## 七、插件管理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/plugin` | 打开插件管理器 | - |
| `/plugin install` | 安装插件 | `/plugin install typescript-lsp@claude-plugins-official` |
| `/plugin list` | 列出已安装插件 | - |
| `/plugin disable` | 禁用插件 | `/plugin disable typescript-lsp` |
| `/plugin enable` | 启用插件 | `/plugin enable typescript-lsp` |
| `/plugin uninstall` | 卸载插件 | `/plugin uninstall typescript-lsp` |
| `/plugin marketplace add` | 添加市场 | `/plugin marketplace add affaan-m/everything-claude-code` |
| `/plugin marketplace update` | 更新市场 | `/plugin marketplace update everything-claude-code` |

---

## 八、配置文件位置

| 配置类型 | 文件路径 | 说明 |
|---------|---------|------|
| **用户设置** | `~/.claude/settings.json` | 插件启用列表、环境变量 |
| **用户配置** | `~/.claude.json` | 项目级配置、MCP 服务器 |
| **项目设置** | `./.claude/settings.json` | 项目级设置 |
| **项目 MCP** | `./.mcp.json` | 项目级 MCP 配置 |
| **项目规则** | `./CLAUDE.md` | 项目持久化指令 |
| **用户规则** | `~/.claude/CLAUDE.md` | 用户级规则 |

---

## 九、推荐安装组合

### 9.1 必装插件

```bash
# TypeScript 代码智能
/plugin install typescript-lsp@claude-plugins-official

# GitHub 集成
/plugin install github@claude-plugins-official

# Git 工作流
/plugin install commit-commands@claude-plugins-official

# Everything CC 完整工作流
/plugin install everything-claude-code@everything-claude-code
```

### 9.2 必装 MCP

```bash
# 文档查询
claude mcp add context7 -- npx -y @upstash/context7-mcp

# E2E 测试
claude mcp add playwright -- npx -y @playwright/mcp
```

---

## 十、快捷技巧

| 技巧 | 说明 |
|------|------|
| `@filename` | 引用特定文件 |
| `@*.vue` | 引用所有匹配文件 |
| `Ctrl+O` | 查看诊断信息 |
| `Shift+Tab` | 切换权限模式 |
| `/help` | 查看帮助 |
| `/bug` | 报告问题 |

---

## 📚 参考链接

- **官方文档：** https://code.claude.com/docs/
- **GitHub 仓库：** https://github.com/anthropics/claude-code
- **Everything CC：** https://github.com/affaan-m/everything-claude-code
- **MCP 注册表：** https://api.anthropic.com/mcp-registry/docs

---

**最后更新：** 2026-03-02
