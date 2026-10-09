# fevnem.github.io — the Notebook

A personal site that is authored in **markdown**, rendered by a markdown renderer written for it, and
has **no build step and no dependencies**. It is served as plain files by GitHub Pages.

    index.html              the cover
    biodata.html            the person, as a chronology
    projects.html           what has shipped
    articles.html           the index of entries
    uses.html               the bench, listed honestly
    contact.html            how to reach me
    404.html                the fallback path — the dead end, kept tidy
    a/<slug>.html           one tiny stub per entry (the entry itself is markdown)
    articles/<slug>.md      the writing, in markdown
    articles/manifest.json  one line per entry, newest first
    css/notebook.css        the entire look
    js/md.js                the markdown renderer
    js/site.js              routing, tabs, theme, entry loading
    docs/NOTEBOOK.md        the build contract (tokens, class names, markup shapes, budgets)

## Writing an entry

1. Add `articles/<slug>.md` — front matter plus prose:

       ---
       title: Thirty-eight microseconds
       date: 2026-10-09
       summary: One line for the index.
       tags: [gps, relativity]
       minutes: 6
       draft: false
       ---

2. Add one object to `articles/manifest.json`, newest first.
3. Copy `a/thirty-eight-microseconds.html` to `a/<slug>.html` and change its `<title>` and the
   `<h1 class="entry-title">`. The stub is a shell: `js/site.js` reads the slug from the path,
   fetches the markdown and renders it into the page — so the entry has a real URL on any static
   host, with no generated HTML to keep in sync.

Nothing needs to be compiled, installed or generated. There is no `package.json`, no bundler, no
theme file to configure, no plugin.

## The rules

- **No dependencies, no build, no tracking.** Zero requests leave this domain: system fonts only, no
  analytics, no third-party anything.
- **Escape-then-tag.** Every character of author text is escaped before any tag is inserted, so a
  hostile markdown file cannot inject markup.
- **Nav items are real pages.** No same-page anchors anywhere in the navigation.
- **Lightweight on purpose.** Roughly 9 KB of JavaScript and 12 KB of CSS in total, no images.

## Markdown support

Headings, paragraphs, bold / italic / strike / inline code, links and images, nested ordered and
unordered lists, task lists, blockquotes, fenced code with a language class, indented code, pipe
tables, horizontal rules, footnotes and hard breaks. Raw HTML inside a `.md` file is escaped and
shown as text — never executed.

## Local preview

    python3 -m http.server 8140 --bind 127.0.0.1

Then open <http://127.0.0.1:8140/>. An entry lives at `/a/<slug>.html`, and `articles.html?tag=gps`
filters the index by tag.

Deploying is a push to `main`: `.github/workflows/deploy.yml` publishes the repository root.
