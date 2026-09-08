export async function fetchTproStats(speciesId) {
  const res = await axios.post('tpro/stats', { speciesId });
  const data = res.data || {};

  if (data.status === 2) {
    window.vrouter.replace('/signin');
    return null;
  }

  if (data.status !== 1 || !data.options?.stats) {
    throw new Error(data.msg || 'Failed to load T-Pro stats');
  }

  return data.options.stats;
}

import { STAT_ITEMS } from './tpro-resources.js';

export { STAT_ITEMS };

export function createEmptyStats() {
  return STAT_ITEMS.reduce((acc, item) => {
    acc[item.key] = 0;
    return acc;
  }, {});
}
