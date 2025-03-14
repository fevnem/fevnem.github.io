import { getCollection } from 'astro:content';

export async function GET({ url }) {
  const query = url.searchParams.get('q')?.toLowerCase().trim() || '';
  
  if (!query) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const posts = await getCollection('blog');
  
  const searchResults = posts
    .map(post => {
      let score = 0;
      const title = post.data.title.toLowerCase();
      const description = post.data.description.toLowerCase();
      const tags = post.data.tags.map(tag => tag.toLowerCase());

      // Exact matches (highest priority)
      if (title === query) score += 200;
      if (tags.includes(query)) score += 180;

      // Starts with matches (high priority)
      if (title.startsWith(query)) score += 150;
      tags.forEach(tag => {
        if (tag.startsWith(query)) score += 100;
      });

      // Contains matches
      if (title.includes(query)) score += 75;
      if (description.includes(query)) score += 50;
      tags.forEach(tag => {
        if (tag.includes(query)) score += 60;
      });

      // Word boundary matches
      const wordBoundaryRegex = new RegExp(`\\b${query}`, 'i');
      if (wordBoundaryRegex.test(title)) score += 45;
      if (wordBoundaryRegex.test(description)) score += 30;

      // Individual word matches
      const queryWords = query.split(/\s+/);
      queryWords.forEach(word => {
        if (title.includes(word)) score += 25;
        if (description.includes(word)) score += 15;
        tags.forEach(tag => {
          if (tag.includes(word)) score += 20;
        });
      });

      // Letter sequence matches for short queries (1-3 characters)
      if (query.length <= 3) {
        const titleChars = title.split('');
        let matches = 0;
        let lastMatchIndex = -1;
        
        for (const char of query) {
          for (let i = lastMatchIndex + 1; i < titleChars.length; i++) {
            if (titleChars[i] === char) {
              matches++;
              lastMatchIndex = i;
              break;
            }
          }
        }
        
        if (matches === query.length) {
          score += 40;
        }
      }

      return {
        score,
        slug: post.slug,
        title: post.data.title,
        description: post.data.description,
        tags: post.data.tags,
        featured: post.data.featured
      };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return new Response(JSON.stringify(searchResults), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}