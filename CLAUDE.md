# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VitePress static blog/site deployed to GitHub Pages at `/Essays-Blog/`.

## Commands

```bash
yarn docs:dev      # Start dev server
yarn docs:build    # Build for production (outputs to docs/.vitepress/dist)
yarn docs:preview  # Preview production build locally
```

## Architecture

- **Content**: All markdown files go in `docs/` directory
- **Config**: VitePress configuration in `docs/.vitepress/config.mts`
- **Base path**: Site is deployed to `/Essays-Blog/` (configured in config.mts)
- **Dynamic routes**: Uses VitePress dynamic routing (e.g., `docs/dynamic/[pkg].md` with `[pkg].paths.ts` for path generation)
- **Deployment**: GitHub Actions auto-deploys on push to `main` branch (see `.github/workflows/deploy.yml`)

## Deployment

Pushing to `main` triggers automatic build and deployment to GitHub Pages. No manual deployment needed.