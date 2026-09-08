const { prisma } = require('./db');
const { formatNotificationTime } = require('../lib/dates');

function mapNotification(notification) {
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
}

async function listNotifications(userId, { filter = 'all', search = '' } = {}) {
  const conditions = [{ user_id: userId }];

  if (filter === 'unread') {
    conditions.push({ read: false });
  } else if (filter === 'read') {
    conditions.push({ read: true });
  }

  if (search) {
    conditions.push({
      OR: [
        { message: { contains: search } },
        { tag: { contains: search } },
        { from_user: { contains: search } },
        { task_id: { contains: search } },
      ],
    });
  }

  const where = conditions.length === 1 ? conditions[0] : { AND: conditions };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  return notifications.map(mapNotification);
}

async function markRead(userId, id) {
  const notificationId = Number(id);

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return null;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      user_id: userId,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return mapNotification(updated);
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      user_id: userId,
      read: false,
    },
    data: { read: true },
  });

  return result.count;
}

async function createNotification(userId, { tag, tagColor, message, taskId, fromUser } = {}) {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedMessage || !tag) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      tag,
      tag_color: tagColor || '#26c0e2',
      message: trimmedMessage,
      task_id: taskId || null,
      from_user: fromUser || null,
    },
  });

  return mapNotification(notification);
}

module.exports = {
  createNotification,
  listNotifications,
  markAllRead,
  markRead,
};
