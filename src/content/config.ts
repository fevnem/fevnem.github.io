import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    references: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string().optional(),
      authors: z.array(z.string()).optional(),
      date: z.string().optional(),
    })).optional(),
  }),
});

export const collections = { blog };