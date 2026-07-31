# fevnem.github.io 🌱

My personal digital garden — a lightweight Hugo blog deployed to GitHub Pages.

## Stack

- **Hugo** (v0.164+, extended) — single-binary static site generator, no Node.js needed
- **PaperMod** theme (v8.0) — clean, fast, blog-native
- **GitHub Actions** — automatic build + deploy on every push to `main`

## Project structure

```
├── archetypes/          # New-post templates
├── content/
│   ├── about.md         # About page
│   ├── archives.md      # Archives page
│   ├── posts/           # ✍️ Your blog posts (markdown)
│   └── search.md        # Client-side search page
├── themes/PaperMod/     # Theme (git submodule)
├── hugo.toml            # Site config
└── .github/workflows/   # CI/CD
```

## Writing a post

Drop a markdown file in `content/posts/`:

```markdown
---
title: "My New Post"
description: "Short summary"
date: 2026-07-31
tags: ["tech"]
---

Content here...
```

Then push — GitHub Actions builds and deploys automatically.

## Local dev

```bash
hugo server -D   # preview at http://localhost:1313
hugo             # build static site into public/
```
