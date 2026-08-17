# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VitePress v1.6 static blog deployed to GitHub Pages at `/Essays-Blog/`.

## Commands

```bash
yarn docs:dev      # Start dev server (http://localhost:5173)
yarn docs:build    # Build for production (outputs to docs/.vitepress/dist)
yarn docs:preview  # Preview production build locally
```

## Architecture

- **Content**: Markdown files in `docs/` directory
- **Config**: `docs/.vitepress/config.mts` - VitePress config with sidebar and nav
- **Base path**: `/Essays-Blog/` (set in config.mts `base` property)
- **Dynamic routes**: `docs/dynamic/[pkg].md` + `[pkg].paths.ts` pattern for generated pages
- **Deployment**: GitHub Actions auto-deploys on push to `main`

## Content Structure

Sidebar sections defined in config.mts:
- `cc/` - Claude Code documentation
- `openclaw/` - OpenClaw guides and output
- Root level - Examples and index

## Environment

- Node.js 20 (specified in CI workflow)
- Yarn 1.22 as package manager