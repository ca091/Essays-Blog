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
        text: '指南',
        items: [
          { text: 'Claude Code 命令大全', link: '/cc/claude-code-commands' }
        ]
      },
      {
        text: 'OpenClaw',
        items: [
          { text: 'OpenClaw 输出', link: '/openclaw/' },
          { text: 'OpenClaw Output', link: '/openclaw/openclaw-output' }
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
