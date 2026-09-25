import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { loadEnv } from 'vite';
import privacy from './src/content/privacy.json' with { type: 'json' };
const env = {
  ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''),
  ...process.env,
};
const live =
  env.PUBLICATION_MODE === 'live' &&
  (!env.CONTEXT || env.CONTEXT === 'production');
if (
  live &&
  (!env.SITE_URL ||
    !env.CONTACT_EMAIL ||
    env.PRIVACY_APPROVED !== 'true' ||
    !privacy.approved ||
    !privacy.controller ||
    !privacy.updated ||
    !privacy.sections.length ||
    env.IMAGES_APPROVED !== 'true' ||
    env.NEWSLETTER_PROVIDER !== 'brevo' ||
    !env.BREVO_API_KEY ||
    !env.BREVO_LIST_ID ||
    !env.BREVO_TEMPLATE_ID ||
    !env.UPSTASH_REDIS_REST_URL ||
    !env.UPSTASH_REDIS_REST_TOKEN)
)
  throw new Error(
    'Publicación bloqueada: completar datos reales, privacidad, imágenes, altas y protección contra abuso.',
  );
if (env.NETLIFY && !live && !env.PREVIEW_PASSWORD)
  throw new Error(
    'Configurar PREVIEW_PASSWORD para proteger la preview en Netlify.',
  );
export default defineConfig({
  site: env.SITE_URL || 'https://lucasbanega.com',
  output: 'server',
  adapter: netlify({ devFeatures: false, imageCDN: false }),
  devToolbar: { enabled: false },
});
