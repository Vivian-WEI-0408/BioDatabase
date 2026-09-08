const ROLE_USER = 0;
const ROLE_DATA_ADMIN = 1;
const ROLE_ADMIN = 9;
const ALLOWED_ROLES = [ROLE_USER, ROLE_DATA_ADMIN, ROLE_ADMIN];

const ROLE_LABELS = {
  [ROLE_USER]: '普通用户',
  [ROLE_DATA_ADMIN]: '数据管理员',
  [ROLE_ADMIN]: '管理员',
};

function parseRole(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const role = Number.parseInt(value, 10);

  if (!Number.isInteger(role) || !ALLOWED_ROLES.includes(role)) {
    return null;
  }

  return role;
}

function isDataAdmin(role) {
  return Number(role) === ROLE_DATA_ADMIN;
}

function isAdmin(role) {
  return Number(role) >= ROLE_ADMIN;
}

function canManageDatasetRows(role) {
  return isDataAdmin(role) || isAdmin(role);
}

module.exports = {
  ROLE_USER,
  ROLE_DATA_ADMIN,
  ROLE_ADMIN,
  ALLOWED_ROLES,
  ROLE_LABELS,
  parseRole,
  isDataAdmin,
  isAdmin,
  canManageDatasetRows,
};
