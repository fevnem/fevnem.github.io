# The Notebook — build contract (frozen)

Everything in this file is fixed. Hands write **one file each** against it; the manager verifies
against it. If something here is wrong or missing, say so in your summary — do not invent a
different class name, token or markup shape, because another hand is writing the other side.

## 0. Rules that override everything

1. **No dependencies, no build step, no `package.json`.** Vanilla ES modules only.
2. **Zero third-party requests.** No CDN, no Google Fonts, no analytics, no images from anywhere.
   System font stacks only: `--sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
   and `--mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
3. **Escape-then-tag, always.** Author text is escaped first; only renderer-generated tags are ever
   inserted. `innerHTML` may receive **renderer output only**; everything else uses `textContent`.
4. **Nav items are real pages — never `href="#…"`.** No same-page anchors under `.tabs`.
5. **Budgets are enforced by `node tools/verify.mjs`** and are hard failures:
   page HTML ≤ 6 KB · `css/notebook.css` ≤ 12 KB · `js/md.js` + `js/site.js` ≤ 8 KB combined ·
   0 off-origin requests · 0 CLS · no horizontal overflow at 1440/1024/900/390.
6. **Motion is optional.** Everything animates with `opacity`/`transform` only, and
   `prefers-reduced-motion: reduce` turns it all off.
7. Typographic apostrophes (’) in author prose; straight quotes only inside code.

## 1. Files and who owns what

| File | Owner (phase) |
|---|---|
| `js/md.js` — `renderMarkdown(md) -> html`, `parseFrontMatter(md) -> {data, body}` | P1 hand A |
| `tools/md-test.mjs` + `tools/fixtures/*.md` — conformance + hostile-input suite | P1 hand B |
| `js/site.js` — router, tab state, article loading | P2 hand C |
| `404.html` — router fallback **and** dead-end page | P2 hand D |
| `css/notebook.css` — the paper (all styling lives here) | P3 hand E |
| `index.html` — the cover | P4 hand F |
| `articles.html` — entry index | P4 hand G |
| `biodata.html` · `projects.html` · `uses.html` · `contact.html` · `styleguide.html` | P5+ hands |
| `articles/*.md` + `articles/manifest.json` | manager (author content) |
| `tools/verify.mjs` | manager |

Do not edit a file you do not own. Do not edit `docs/NOTEBOOK.md` — report the problem instead.

## 2. Design tokens (exact names; only `css/notebook.css` may declare them)

```css
:root{
  /* paper */
  --paper:#f6f2e9; --paper-2:#efe9db; --paper-3:#e6dfd0;
  --ink:#12100c; --ink-2:#33302a; --ink-3:#6b655a; --ink-4:#948d80;
  --rule:#d9d2c2;            /* faint ruling */
  --margin-line:#c2564a;     /* the red margin rule */
  --punch:#e2dbcb;           /* punched holes */
  --tab:#e8e1d1; --tab-ink:#3a352c; --tab-active:#12100c; --tab-active-ink:#f6f2e9;
  --accent:#b23a2f;          /* margin red, used sparingly */
  --signal:#2f7d4f;          /* "shipped / passing" */
  /* desk lamp (dark) */
  --lamp:#f7e7c4;
  /* type */
  --fs-100:.8125rem; --fs-200:.9375rem; --fs-300:1.0625rem;
  --fs-400:clamp(1.2rem,1.05rem+.7vw,1.5rem);
  --fs-500:clamp(1.6rem,1.25rem+1.4vw,2.4rem);
  --fs-600:clamp(2.4rem,1.4rem+4.6vw,4.6rem);
  --lh-display:.98; --lh-body:1.62;
  --track-tight:-.02em; --track-wide:.16em;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  /* rhythm */
  --sp-1:.25rem; --sp-2:.5rem; --sp-3:.75rem; --sp-4:1rem; --sp-6:1.5rem;
  --sp-8:2rem; --sp-12:3rem; --sp-16:4rem;
  --measure:38rem; --margin-w:11rem; --tabs-w:7.5rem;
  --rule-gap:2rem;           /* ruling line every 2rem */
  --radius:3px;
}
html.dark{
  --paper:#14120f; --paper-2:#1a1815; --paper-3:#211e19;
  --ink:#efe9dd; --ink-2:#d5cec0; --ink-3:#a49c8c; --ink-4:#7d766a;
  --rule:#2b2721; --margin-line:#8f4438; --punch:#201d18;
  --tab:#1d1a16; --tab-ink:#cfc7b8; --tab-active:#efe9dd; --tab-active-ink:#14120f;
  --accent:#e0715f; --signal:#63c08a; --lamp:#3a2f1c;
}
```

Everything else consumes tokens. **No raw hex outside this block.**

## 3. Page skeleton (identical shape on every page)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>… | Rakib Hasan</title>
  <meta name="description" content="…">
  <link rel="stylesheet" href="css/notebook.css">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <div class="sheet">                         <!-- paper stock + ruling + punch holes -->
    <main class="page" id="main" data-page="index">
      <aside class="margin" aria-label="Notes"></aside>   <!-- marginalia column (left) -->

      <div class="prose">                      <!-- the reading column; max-width var(--measure) -->
        <!-- page content -->
      </div>

      <nav class="tabs" aria-label="Sections"> <!-- right edge, physical tabs -->
        <a class="tab" href="index.html"      data-tab="index">Index</a>
        <a class="tab" href="biodata.html"    data-tab="biodata">Biodata</a>
        <a class="tab" href="projects.html"   data-tab="projects">Projects</a>
        <a class="tab" href="articles.html"   data-tab="articles">Articles</a>
        <a class="tab" href="uses.html"       data-tab="uses">Uses</a>
        <a class="tab" href="contact.html"    data-tab="contact">Contact</a>
        <button class="tab tab--theme" id="theme-toggle" aria-label="Switch theme">Lamp</button>
      </nav>
    </main>

    <footer class="colophon">
      <span>© 2026 Rakib Hasan</span>
      <span class="mono">no build · no dependencies · verified by <code>tools/verify.mjs</code></span>
      <a href="https://github.com/fevnem" rel="noreferrer">GitHub</a>
    </footer>
  </div>

  <script type="module" src="js/site.js"></script>
</body>
</html>
```

`data-page` on `.page` is set per page: `index|biodata|projects|articles|article|uses|contact|404|styleguide|print`.
`js/site.js` adds `is-active` to the `.tab` whose `data-tab` matches `data-page` (an article page
activates `articles`). Tabs are links — the router never intercepts clicks on them.

## 4. Markdown output markup (what `js/md.js` must produce)

| Markdown | HTML |
|---|---|
| `# H1` … `###### H6` | `<h1>`…`<h6>` (h1 only in the entry body when front matter has no `title`) |
| paragraph | `<p>` |
| `**b**` `*i*` `` `c` `` `~~s~~` | `<strong>` `<em>` `<code>` `<del>` |
| `[text](url)` | `<a href="url">text</a>` — `javascript:`/`data:` URLs are neutralised to `#` |
| `![alt](src)` | `<img src alt loading="lazy" decoding="async">` (no width/height available — CSS pins aspect) |
| `- a` / `1. a`, nested 2 spaces | `<ul><li>` / `<ol><li>` (nesting allowed) |
| `- [ ]` / `- [x]` | `<li class="task"><input type="checkbox" disabled checked?>` |
| `> quote` | `<blockquote>` |
| ` ```lang ` fenced | `<pre><code class="lang-lang">` — worst case, unclosed fence runs to EOF |
| 4-space indent | `<pre><code>` (no lang) |
| pipe tables | `<div class="table-wrap"><table><thead>…<tbody>…` |
| `---` | `<hr>` |
| `[^1]` + `[^1]: note` | `<sup class="fn-ref"><a href="#fn-1" id="fnref-1">1</a></sup>` + `<ol class="footnotes">` |
| `\n\n` | paragraph break |
| raw HTML | **escaped** (never executed) |

Every output block gets stable class names only where listed above. No inline `style=`.

## 5. Entry files

`articles/<slug>.md` — slug is `[a-z0-9-]+`, matches the manifest. Front matter:

```
---
title: Thirty-eight microseconds
date: 2026-10-09
summary: Why the clocks in orbit run fast, and what it costs if you ignore it.
tags: [gps, relativity]
minutes: 6
draft: false
---
```

`articles/manifest.json` — `[{ "slug", "title", "date", "summary", "tags":[], "minutes", "draft" }]`,
newest first. Adding an entry = the `.md` file + one manifest line.

## 6. Definition of done for every hand

```
node --check <yourfile>            # JS hands
node tools/md-test.mjs             # P1 hands
node tools/verify.mjs              # everyone: must end "0 failed"
```

Report, with real pasted output: what you wrote, the exact gate command, the numbers it printed,
and anything in this contract that turned out to be wrong.
