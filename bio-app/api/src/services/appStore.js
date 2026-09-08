const { prisma } = require('./db');
const { formatAppDate, formatTaskCount } = require('../lib/dates');

const HIDDEN_APP_IDS = new Set(['lab-database']);

async function listApps(userId) {
  const [apps, favorites, taskCounts] = await Promise.all([
    prisma.app.findMany({
      where: {
        id: { notIn: [...HIDDEN_APP_IDS] },
        status: 1,
      },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.userAppFavorite.findMany({
      where: { user_id: userId },
      select: { app_id: true },
    }),
    prisma.task.groupBy({
      by: ['app_id'],
      where: {
        OR: [
          { user_id: userId },
          { shared_with_user_id: userId },
        ],
      },
      _count: { _all: true },
    }),
  ]);

  const favoriteSet = new Set(favorites.map((item) => item.app_id));
  const countMap = new Map(taskCounts.map((item) => [item.app_id, item._count._all]));

  return apps.map((app) => ({
    id: app.id,
    title: app.title,
    description: app.description,
    icon: app.icon,
    route: app.route,
    author: app.author,
    date: formatAppDate(app.created_at),
    taskCount: formatTaskCount(countMap.get(app.id) || 0),
    starred: favoriteSet.has(app.id),
  }));
}

async function toggleStar(userId, appId) {
  if (HIDDEN_APP_IDS.has(appId)) {
    return null;
  }

  const app = await prisma.app.findUnique({ where: { id: appId } });

  if (!app || app.status !== 1) {
    return null;
  }

  const existing = await prisma.userAppFavorite.findFirst({
    where: {
      user_id: userId,
      app_id: appId,
    },
  });

  if (existing) {
    await prisma.userAppFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.userAppFavorite.create({
    data: {
      user_id: userId,
      app_id: appId,
    },
  });

  return true;
}

module.exports = {
  listApps,
  toggleStar,
};
