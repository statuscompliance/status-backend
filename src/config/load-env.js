// load-env.js
if (!import.meta.env?.VITEST) {
  await import('dotenv/config');
}
await import('../index.js');
