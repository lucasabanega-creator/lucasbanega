import privacy from '../content/privacy.json';
const env = (key: string) => process.env[key] || import.meta.env[key] || '';
const url = new URL(env('SITE_URL') || 'https://lucasbanega.com');
if (
  url.protocol !== 'https:' ||
  url.username ||
  url.password ||
  url.pathname !== '/'
)
  throw new Error('SITE_URL debe ser un origen HTTPS real.');
const productionContext = !env('CONTEXT') || env('CONTEXT') === 'production';
const live = env('PUBLICATION_MODE') === 'live' && productionContext;
const publicPrelaunch =
  env('PUBLICATION_MODE') === 'public-prelaunch' && productionContext;
const publicSite = live || publicPrelaunch;
const contact = env('CONTACT_EMAIL');
if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))
  throw new Error('CONTACT_EMAIL inválido.');
const providerReady =
  env('NEWSLETTER_PROVIDER') === 'brevo' &&
  Boolean(env('BREVO_API_KEY')) &&
  /^[1-9]\d*$/.test(env('BREVO_LIST_ID')) &&
  /^[1-9]\d*$/.test(env('BREVO_TEMPLATE_ID'));
const limiterReady =
  /^https:\/\/[^/]+\.upstash\.io$/.test(env('UPSTASH_REDIS_REST_URL')) &&
  Boolean(env('UPSTASH_REDIS_REST_TOKEN'));
const privacyReady =
  env('PRIVACY_APPROVED') === 'true' &&
  privacy.approved &&
  Boolean(privacy.controller) &&
  Boolean(privacy.updated) &&
  privacy.sections.length > 0;
if (
  live &&
  (!privacyReady ||
    !providerReady ||
    !limiterReady ||
    !contact ||
    env('IMAGES_APPROVED') !== 'true')
)
  throw new Error(
    'Publicación bloqueada: completar contacto, proveedor, privacidad e imágenes aprobadas.',
  );
export const site = {
  url: url.origin,
  live,
  public: publicSite,
  mode: 'prelaunch' as 'prelaunch' | 'commerce',
  contact,
  newsletter: live && privacyReady && providerReady && limiterReady,
  privacy,
  previewPassword: publicSite ? '' : env('PREVIEW_PASSWORD'),
};
export const serverEnv = env;
