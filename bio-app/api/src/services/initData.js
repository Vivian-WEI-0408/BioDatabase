const { seedApps, seedDocuments, seedUserData } = require('./seedData');

let globalInitPromise;
const userInitPromises = new Map();

async function initGlobalData() {
  if (!globalInitPromise) {
    globalInitPromise = (async () => {
      await seedApps();
      await seedDocuments();
    })();
  }

  return globalInitPromise;
}

async function ensureUserData(userId) {
  if (!userId) {
    return;
  }

  await initGlobalData();

  if (!userInitPromises.has(userId)) {
    userInitPromises.set(userId, seedUserData(userId).finally(() => {
      userInitPromises.delete(userId);
    }));
  }

  return userInitPromises.get(userId);
}

async function initData() {
  await initGlobalData();
}

module.exports = {
  ensureUserData,
  initData,
};
