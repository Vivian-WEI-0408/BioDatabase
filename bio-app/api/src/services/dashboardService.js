const { prisma } = require('./db');
const { formatNotificationTime } = require('../lib/dates');
const { listApps } = require('./appStore');

function buildTaskStats(tasks) {
  const dates = [];
  const values = [];
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  for (let offset = 9; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);

    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const dateLabel = `${month}/${day.getDate().toString().padStart(2, '0')}`;
    dates.push(dateLabel);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = tasks.filter((task) => {
      const createdAt = new Date(task.created_at);
      return createdAt >= day && createdAt < nextDay;
    }).length;

    values.push(count);
  }

  return { dates, values };
}

async function getDashboardData(userId) {
  const [appCards, notifications, todos, tasks, storage] = await Promise.all([
    listApps(userId),
    prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 3,
    }),
    prisma.todo.findMany({
      where: { user_id: userId },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { user_id: userId },
          { shared_with_user_id: userId },
        ],
      },
      select: {
        created_at: true,
      },
    }),
    prisma.userStorage.findUnique({
      where: { user_id: userId },
    }),
  ]);

  const usedMb = storage?.used_mb || 0;
  const totalMb = storage?.total_mb || 1024;
  const usedPercent = totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0;

  return {
    appCards: appCards.map(({ id, title, description, icon, route }) => ({
      id,
      title,
      description,
      icon,
      route,
    })),
    notifications: notifications.map((notification) => {
      const item = {
        id: notification.id,
        tag: notification.tag,
        tagColor: notification.tag_color,
        message: notification.message,
        time: formatNotificationTime(notification.created_at),
        read: notification.read,
      };

      if (notification.task_id) {
        item.taskId = notification.task_id;
      }

      if (notification.from_user) {
        item.user = notification.from_user;
      }

      return item;
    }),
    todos: todos.map((todo) => {
      const item = {
        id: todo.id,
        text: todo.text,
        done: todo.done,
      };

      if (todo.highlight) {
        item.highlight = todo.highlight;
      }

      return item;
    }),
    taskStats: buildTaskStats(tasks),
    storage: {
      usedPercent,
      availablePercent: 100 - usedPercent,
      totalMB: totalMb,
    },
  };
}

module.exports = {
  getDashboardData,
};
