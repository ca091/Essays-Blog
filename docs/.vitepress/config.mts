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
      { icon: 'github', link: 'https://github.com/caoqi/Essays-Blog' }
    ]
  },
  base: '/Essays-Blog/'
})
