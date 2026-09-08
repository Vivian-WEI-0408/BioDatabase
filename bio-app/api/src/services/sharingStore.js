const { prisma } = require('./db');

const DEFAULT_AVATAR = '/images/avatar.png';

function mapShareUser(user) {
  return {
    userId: user.id,
    id: String(user.id),
    name: user.name || user.email,
    email: user.email,
    role: user.title || 'User',
    avatar: user.avatar || DEFAULT_AVATAR,
  };
}

function addShareCard(cardMap, user, taskId) {
  if (!user) {
    return;
  }

  const key = String(user.id);
  if (!cardMap.has(key)) {
    cardMap.set(key, {
      ...mapShareUser(user),
      status: 'Tasks',
      taskIds: new Set(),
      datasetCount: 0,
    });
  }

  cardMap.get(key).taskIds.add(taskId);
}

function finalizeCards(cardMap, search = '') {
  const q = search.toLowerCase();
  return [...cardMap.values()]
    .map((card) => {
      const taskCount = card.taskIds.size;
      const { taskIds, ...rest } = card;
      return {
        ...rest,
        taskCount,
      };
    })
    .filter((card) => {
      if (!q) {
        return true;
      }

      return card.name.toLowerCase().includes(q)
        || card.email.toLowerCase().includes(q)
        || card.role.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listSharing(userId, { search = '' } = {}) {
  const [toMeShares, fromMeShares, legacyToMe, legacyFromMe] = await Promise.all([
    prisma.taskShare.findMany({
      where: { target_user_id: userId },
      include: {
        owner: true,
        task: { select: { id: true } },
      },
    }),
    prisma.taskShare.findMany({
      where: { owner_user_id: userId },
      include: {
        target: true,
        task: { select: { id: true } },
      },
    }),
    prisma.task.findMany({
      where: { shared_with_user_id: userId },
      include: { user: true },
    }),
    prisma.task.findMany({
      where: {
        user_id: userId,
        shared_with_user_id: { not: null },
      },
      include: { shared_with: true },
    }),
  ]);

  const toMeMap = new Map();
  const fromMeMap = new Map();

  toMeShares.forEach((share) => addShareCard(toMeMap, share.owner, share.task_id));
  fromMeShares.forEach((share) => addShareCard(fromMeMap, share.target, share.task_id));
  legacyToMe.forEach((task) => addShareCard(toMeMap, task.user, task.id));
  legacyFromMe.forEach((task) => addShareCard(fromMeMap, task.shared_with, task.id));

  return {
    toMe: finalizeCards(toMeMap, search),
    fromMe: finalizeCards(fromMeMap, search),
  };
}

async function searchShareUsers(currentUserId, search = '') {
  const q = search.trim();
  const where = {
    id: { not: currentUserId },
    status: 1,
  };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { title: { contains: q } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  return users.map(mapShareUser);
}

module.exports = {
  listSharing,
  searchShareUsers,
};
