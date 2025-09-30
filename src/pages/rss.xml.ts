import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const posts = await getCollection('blog');
  const site = context.site || 'https://fevnem.github.io';

  return rss({
    title: 'fevnem blogs',
    description: 'I,tri, updates here about everything',
    site: site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}/`,
      content: sanitizeHtml(parser.render(post.body)),
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
