import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://therocketor.github.io',
  base: '/',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
});