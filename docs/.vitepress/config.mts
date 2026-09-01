import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Essays Blog",
  description: "Essays Blog Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Claude Code', link: '/cc/claude-code-commands' }
    ],

    sidebar: [
      {
        text: 'Claude Code',
        items: [
          { text: '命令大全', link: '/cc/claude-code-commands' }
        ]
      },
      {
        text: 'Git',
        items: [
          { text: 'Worktree 常用命令速查', link: '/git/git-worktree-cheatsheet' }
        ]
      },
      {
        text: '前端工程',
        items: [
          { text: '移动端键盘与 VisualViewport 排错', link: '/frontend-engineering/mobile-keyboard-visual-viewport-debugging' }
        ]
      },
      {
        text: 'AI 视频',
        items: [
          { text: 'MoneyPrinterTurbo 视频生成工作流', link: '/ai-video/moneyprinterturbo-video-generation-workflow' }
        ]
      },
      {
        text: '英语学习',
        items: [
          { text: '提升英语阅读能力：网站选择与练习路径', link: '/language-learning/english-reading-websites' }
        ]
      },
      {
        text: 'OpenClaw',
        items: [
          { text: '概述', link: '/openclaw/' },
          { text: '创建 Skill 教程', link: '/openclaw/how-to-create-openclaw-skill' },
          { text: '语音代理构建指南', link: '/openclaw/voice-agent-guide' },
          { text: 'Discord 最佳实践', link: '/openclaw/openclaw-discord-best-practice' }
        ]
      },
      {
        text: '示例',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ca091/Essays-Blog' }
    ]
  },
  base: '/Essays-Blog/'
})
