const allRoles = {
  user: ['discord', 'getProfile'],
  admin: ['getUsers', 'manageUsers', 'discord', 'getProfile', 'getIssues'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
