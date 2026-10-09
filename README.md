# fevnem.github.io — the Notebook

A personal site where the writing lives as **plain markdown** and is rendered in the browser by a
markdown renderer that was written for it. No generator, no build step, no dependencies — the files
in this repository are the site.

**Live: [fevnem.github.io](https://fevnem.github.io/)**

---

## About

This is the personal site of **tri** ([`fevnem`](https://github.com/fevnem)) — python, go, js and
backend work, mostly small self-contained things that can be read in an afternoon and run to the
end.

It is a notebook rather than a portfolio: what I am building, the numbers behind it, and the parts
that took longer than they should have. Six pages hold it —

- **Index** — what I work on now, and the most recent entries.
- **Biodata** — the person, as a chronology and a list of what I build.
- **Projects** — the repos that run, each linking to the code.
- **Articles** — the writing, one markdown file per entry.
- **Uses** — the bench, listed honestly.
- **Contact** — one channel, no forms.

The site is deliberately shaped like the software it describes: few moving parts, everything
readable, nothing hidden behind a toolchain.

---

## The unusual parts

Three decisions shape the whole repository.

**1. Articles are markdown, rendered in the browser.** An entry is one `.md` file with front matter.
`js/md.js` — about 6 KB, no dependencies — parses and renders it at read time. Nothing is
pre-rendered, so there is no generated HTML to fall out of sync with the source.

**2. Every entry has a real URL on any static host.** `a/<slug>.html` is a tiny shell: `js/site.js`
reads the slug from the path, fetches `articles/<slug>.md`, and renders it into the page. No server,
no rewrite rules, no build — the same file works on GitHub Pages, any static host, or a plain
`http.server`.

**3. `404.html` is also the router.** A deep link like `/a/thirty-eight-microseconds` (served
through the fallback on hosts that support it) resolves to the entry, and the page degrades to a
tidy "no such entry" list when there is no slug. Without JavaScript, that fallback is still what
you see.

---

## Files

| Path | What it is |
| --- | --- |
| `index.html` · `biodata.html` · `projects.html` · `articles.html` · `uses.html` · `contact.html` | the six pages |
| `404.html` | the fallback path — dead end and router in one file |
| `a/<slug>.html` | one tiny stub per entry; the entry itself is markdown |
| `articles/<slug>.md` | the writing |
| `articles/manifest.json` | one object per entry, newest first |
| `css/notebook.css` | the entire look — paper, ruled stock, tabs, dark mode |
| `js/md.js` | the markdown renderer |
| `js/site.js` | routing, tabs, theme, entry loading |
| `assets/favicon.svg` | the one image, drawn in vectors |
| `.github/workflows/deploy.yml` | publishes the repository root to GitHub Pages |

Total: **57 KB** of files — ~11.6 KB of CSS and ~9.9 KB of JavaScript, the rest markup and prose.

---

## Writing an entry

1. **Add the file** — `articles/<slug>.md`, front matter then prose:

   ```markdown
   ---
   title: Thirty-eight microseconds
   date: 2026-10-09
   summary: One line for the index.
   tags: [gps, relativity]
   minutes: 6
   draft: false
   ---
   ```

2. **List it** — add one object to `articles/manifest.json`, newest first. The index, tag filter
   and `<title>` all read from it.

3. **Give it a URL** — copy `a/thirty-eight-microseconds.html` to `a/<slug>.html` and change its
   `<title>` and `<h1 class="entry-title">`. That is the whole shell.

Nothing is compiled, installed or generated: no `package.json`, no bundler, no theme file, no
plugin, no config.

---

## Markdown support

Headings, paragraphs, bold / italic / strike / inline code, links and images, nested and ordered
lists, task lists, blockquotes, fenced code with a language class, indented code, pipe tables,
horizontal rules, footnotes and hard breaks.

**Raw HTML in a `.md` file is escaped and shown as text, never executed.** The renderer uses an
escape-then-tag pass: author characters are escaped before any tag is inserted, and link targets
are neutralised (`javascript:`, `data:` → `#`), so a hostile markdown file cannot inject markup.

---

## Rules the site holds to

- **Nav items are real pages** — no same-page anchors anywhere in the navigation.
- **Nothing is fetched from another origin** — system font stacks, no images, no analytics, no
  third-party anything.
- **Paper, not a dashboard** — a ruled sheet with a red margin line in daylight; a warm desk lamp
  behind the reading column in dark mode. All CSS, no image files.
- **Motion is optional** — every animation is disabled under `prefers-reduced-motion`.
- **Print-friendly** — margins and tabs drop away, the prose stays.

---

## Local preview

```sh
python3 -m http.server 8140 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8140/>. An entry lives at `/a/<slug>.html`, and
`articles.html?tag=gps` filters the index by tag.

## Deploying

A push to `main` is the deploy: `.github/workflows/deploy.yml` publishes the repository root with
GitHub Pages. There is no build output — what is in the repository is what is served.

---

## Also on GitHub

- [`where-you-are`](https://github.com/fevnem/where-you-are) — how GPS actually finds you, explained
  with hand-written WebGL2.
- [`unfinished-lives`](https://github.com/fevnem/unfinished-lives) — a browser game about a
  bureaucratic afterlife, told in 32 cases.
- [`github-stats`](https://github.com/fevnem/github-stats) — contribution stats as a live SVG.

## License

No LICENSE file — the writing here is personal, and the code is small enough to read. If you want
to reuse a piece of it, ask first.
