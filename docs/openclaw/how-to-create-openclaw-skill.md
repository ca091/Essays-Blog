# 如何创建一个 OpenClaw Skill

> 📅 创建时间：2026-03-02
> 👤 作者：CQ

---

## 一、什么是 OpenClaw Skill

**Skill** 是 OpenClaw 的可复用工作流定义，用于自动化特定任务。

通过创建 Skill，你可以：
- 标准化重复性工作流程
- 跨会话复用最佳实践
- 分享给团队成员使用

---

## 二、Skill 目录结构

### 2.1 存放位置

| 类型 | 路径 | 说明 |
|------|------|------|
| **用户级 Skill** | `~/.openclaw/skills/<skill-name>/` | 所有会话可用 |
| **项目级 Skill** | `<project>/.openclaw/skills/<skill-name>/` | 仅当前项目可用 |

### 2.2 文件结构

```
~/.openclaw/skills/
└── blog-doc-writer/
    └── SKILL.md
```

**必需文件：**
- `SKILL.md` - Skill 定义文件（Markdown 格式）

---

## 三、创建 Skill 的完整流程

### 3.1 确定 Skill 目标

在创建之前，明确：
- **触发条件**：用户说什么话时激活？
- **执行流程**：需要完成哪些步骤？
- **输出结果**：最终交付什么？

**示例：**
```
目标：将文档输出到 Essays-Blog 的 openclaw 目录
触发词："写一个 OpenClaw 文档"、"输出到 blog"
流程：生成内容 → 写入文件 → 更新索引
```

### 3.2 创建目录

```bash
mkdir -p ~/.openclaw/skills/<skill-name>
```

**示例：**
```bash
mkdir -p ~/.openclaw/skills/blog-doc-writer
```

### 3.3 编写 SKILL.md

**基本结构：**

```markdown
---
name: <skill-name>
description: <简短描述>
disable-model-invocation: false
---

# <Skill 名称>

## 触发条件

当用户提到以下关键词时激活：
- "关键词 1"
- "关键词 2"

## 执行流程

### 1. 步骤一说明

具体内容...

### 2. 步骤二说明

具体内容...

## 示例对话

**用户：** "触发词 + 具体需求"

**助手：**
```
响应内容...
```

## 错误处理

| 错误 | 处理方式 |
|------|---------|
| 文件已存在 | 询问是否覆盖 |
| 目录不存在 | 自动创建目录 |
```

---

## 四、完整示例：blog-doc-writer

### 4.1 Front Matter

```markdown
---
name: blog-doc-writer
description: 将文档输出到 Essays-Blog 的 openclaw 目录，并自动更新索引
disable-model-invocation: false
---
```

### 4.2 触发条件

```markdown
## 触发条件

当用户提到以下关键词时激活此流程：
- "写一个 OpenClaw 文档"
- "输出到 blog"
- "记录到 openclaw"
- "写文档：XXX"
- "输出到 openclaw 目录"
- "/blog-doc-write"
```

### 4.3 执行流程

```markdown
## 执行流程

### 1. 解析文档信息

从用户输入中提取：
- **文档主题**：从用户描述中获取
- **文档标题**：如未指定，根据主题生成
- **文件名**：使用 kebab-case 格式

### 2. 生成文档内容

格式规范：
- 一级标题开始
- 元信息（时间、作者）
- 分级标题 + 表格 + 代码块

### 3. 写入文档

目标路径：
/Users/caoqi/Documents/github/Essays-Blog/docs/openclaw/<filename>.md

### 4. 更新索引

索引文件：
/Users/caoqi/Documents/github/Essays-Blog/docs/openclaw/index.md

在"## 文档列表"下方添加新链接：
- [文档标题](./filename) - 简短描述

### 5. 确认完成

向用户报告：
- ✅ 文档创建成功
- ✅ 索引已更新
- 📄 文件路径
```

### 4.4 示例对话

```markdown
## 示例对话

**用户：** "写一个 OpenClaw 文档，主题是 MCP 配置指南"

**助手：**
```
好的，我来创建文档并更新索引。

📝 正在创建：docs/openclaw/claude-code-mcp-guide.md
📋 正在更新：docs/openclaw/index.md

✅ 完成！
```
```

---

## 五、测试 Skill

### 5.1 触发测试

```
"写一个 OpenClaw 文档，主题是 XXX"
```

### 5.2 验证结果

| 检查项 | 验证方式 |
|--------|---------|
| 文件创建 | `ls docs/openclaw/` |
| 索引更新 | `cat docs/openclaw/index.md` |
| 链接正确 | 点击链接访问 |

---

## 六、最佳实践

### 6.1 命名规范

| 项目 | 规范 | 示例 |
|------|------|------|
| **目录名** | kebab-case | `blog-doc-writer` |
| **Skill 名** | 简短描述性 | `blog-doc-writer` |
| **文件名** | 小写 + 连字符 | `how-to-create-skill.md` |

### 6.2 触发词设计

- ✅ 包含多种表述方式（自然语言 + 命令式）
- ✅ 避免过于通用的词（如"写"、"创建"）
- ✅ 添加命令式触发（如 `/blog-doc-write`）

### 6.3 错误处理

在 Skill 中定义：
```markdown
## 错误处理

| 错误 | 处理方式 |
|------|---------|
| 文件已存在 | 询问用户是否覆盖或创建新版本 |
| 目录不存在 | 创建目录后继续 |
| 权限不足 | 提示用户检查文件权限 |
```

---

## 七、进阶功能

### 7.1 可选步骤

```markdown
## 扩展功能

### 可选：更新首页导航

如果文档重要，可询问用户：
```
需要将此文档添加到首页导航吗？（docs/index.md）
```

### 可选：Git 提交

如果用户需要：
```bash
git add docs/openclaw/
git commit -m "docs: 添加 <文档标题>"
git push
```
```

### 7.2 调用其他 Skill

在复杂场景中，可以组合多个 Skill：
```markdown
1. 调用 `content-generator` 生成内容
2. 调用 `blog-doc-writer` 输出文档
3. 调用 `git-commit` 提交变更
```

---

## 📚 参考链接

- **OpenClaw 官方文档：** https://docs.openclaw.ai/
- **Skill 系统文档：** https://docs.openclaw.ai/skills
- **Essays-Blog 项目：** https://github.com/caoqi/Essays-Blog

---

**最后更新：** 2026-03-02
