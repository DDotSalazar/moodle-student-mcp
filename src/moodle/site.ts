import type { MoodleClient } from './client.js';
import type { SiteInfo } from './types.js';

export function getSiteInfo(client: MoodleClient): Promise<SiteInfo> {
  return client.call<SiteInfo>('core_webservice_get_site_info', {});
}
