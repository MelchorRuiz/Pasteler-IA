import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel/serverless";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [tailwind()],
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en", "fr"],
  },
  security: {
    checkOrigin: true,
  }
});