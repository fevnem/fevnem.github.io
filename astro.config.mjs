import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://fevnem.github.io',
  base: '/',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
});
