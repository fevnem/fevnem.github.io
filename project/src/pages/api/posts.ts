import { getCollection } from 'astro:content';

export async function get() {
  const posts = await getCollection('blog');
  
  const postsData = posts.map(post => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    tags: post.data.tags,
    featured: post.data.featured
  }));

  return new Response(JSON.stringify(postsData), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}