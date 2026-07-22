import { createRouter as sdkRouter } from '@songloft/plugin-sdk';
import { SourceEngine } from './sources/engine';
import { createInfoHandler } from './handlers/info';
import { createSearchHandler } from './handlers/search';
import { createFetchHandler } from './handlers/fetch';
import { createAttachHandler } from './handlers/attach';
import { createScrapeHandler } from './handlers/scrape';
import { createOpenScrapeHandler } from './handlers/open-scrape';
import { createSongsHandler } from './handlers/songs';
import { createWebHandler } from './handlers/web';

export function createRouter(engine: SourceEngine) {
  const router = sdkRouter();

  router.get('/info', createInfoHandler());
  router.get('/songs', createSongsHandler());
  router.get('/search', createSearchHandler(engine));
  router.post('/fetch', createFetchHandler(engine));
  router.post('/attach', createAttachHandler());
  router.post('/scrape', createScrapeHandler(engine));
  router.post('/open-scrape', createOpenScrapeHandler(engine));
  router.get('/', createWebHandler());

  return router;
}
