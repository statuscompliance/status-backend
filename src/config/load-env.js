// load-env.js  /* istanbul ignore if */
if (!import.meta.env?.VITEST) {
  await import('dotenv/config');
}
/* istanbul ignore next */
await import('../index.js');
