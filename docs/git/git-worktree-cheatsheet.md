# Git Worktree 常用命令速查

> 📅 创建时间：2026-08-17
> 👤 作者：CQ

---

## 一、Git Worktree 是什么

Git Worktree 可以让同一个 Git 仓库同时拥有多个工作目录。每个工作目录可以检出不同分支，适合并行开发、紧急修复和临时验证，无需频繁切换分支或重复克隆仓库。

各个 worktree 共享仓库对象和提交历史，但工作目录、暂存区和 `HEAD` 相互独立。

---

## 二、查看 Worktree

```bash
git worktree list
```

列出当前仓库关联的所有 worktree，包括路径、提交、分支以及锁定或可清理状态。

---

## 三、创建 Worktree

### 3.1 基于新分支创建

```bash
git worktree add -b feature/demo ../feature-demo
```

在 `../feature-demo` 创建工作目录，并从当前 `HEAD` 新建和检出 `feature/demo` 分支。

### 3.2 基于已有分支创建

```bash
git worktree add ../feature-demo feature/demo
```

将已有的 `feature/demo` 分支检出到 `../feature-demo`。同一个分支通常不能同时被多个 worktree 检出。

### 3.3 基于指定起点创建

```bash
git worktree add -b feature/demo ../feature-demo origin/main
```

以 `origin/main` 为起点创建 `feature/demo` 分支，并检出到新工作目录。

### 3.4 创建游离 HEAD 的 Worktree

```bash
git worktree add --detach ../temp-check HEAD
```

创建不绑定分支的临时工作目录，适合查看或测试某个提交。

---

## 四、删除与移动 Worktree

### 4.1 删除 Worktree

```bash
git worktree remove ../feature-demo
```

删除指定 worktree。存在未提交修改时，Git 默认会拒绝删除。

### 4.2 强制删除 Worktree

```bash
git worktree remove --force ../feature-demo
```

强制删除 worktree，其中未提交的修改会丢失，使用前应确认内容已提交或不再需要。

### 4.3 移动 Worktree

```bash
git worktree move ../feature-demo ../new-feature-demo
```

将 worktree 移动到新目录，并同步更新 Git 的管理记录。

---

## 五、锁定与解锁 Worktree

### 5.1 锁定 Worktree

```bash
git worktree lock ../feature-demo
```

防止 worktree 的管理记录被自动清理，适合位于移动磁盘或暂时不可访问路径上的工作目录。

### 5.2 解锁 Worktree

```bash
git worktree unlock ../feature-demo
```

解除锁定，使该 worktree 可以再次被正常清理。

---

## 六、清理与修复

### 6.1 清理失效记录

```bash
git worktree prune
```

清除工作目录已被手动删除后遗留的 worktree 管理记录。

### 6.2 预览清理结果

```bash
git worktree prune --dry-run
```

只显示将被清理的记录，不执行实际清理，建议在正式清理前运行。

### 6.3 修复路径记录

```bash
git worktree repair
```

当主仓库或 worktree 被手动移动后，尝试重新建立工作目录与管理记录之间的关联。

---

## 七、常见工作流

```bash
# 更新远程分支信息
git fetch origin

# 从 origin/main 创建功能分支和对应 worktree
git worktree add -b feature/my-feature ../imagent-feature origin/main

# 进入新工作目录进行开发
cd ../imagent-feature

# 开发完成后回到主仓库
cd ../imagent.bot

# 删除 worktree
git worktree remove ../imagent-feature

# 确认分支已合并后删除本地分支
git branch -d feature/my-feature
```

---

## 八、注意事项

- 同一个分支通常不能同时检出到多个 worktree。
- 删除 worktree 前，应先提交、暂存或备份重要修改。
- 建议将 worktree 创建在主仓库的同级目录，避免被主仓库内的构建、搜索或监听工具重复扫描。
- 不要直接删除 worktree 目录；优先使用 `git worktree remove`，以便同步清理管理记录。
- `git worktree remove` 不会自动删除对应分支，确认分支已合并后可使用 `git branch -d` 单独删除。

---

## 参考资料

- [Git 官方文档：git-worktree](https://git-scm.com/docs/git-worktree)

---

**最后更新：** 2026-08-17
