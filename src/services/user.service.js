const httpStatus = require('http-status');
const { User, Issue } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

const getUser = async (username) => {
  return User.findOne({ 'github.username': username });
};

/**
 * Create or update user by githubId
 * @param {Object} profile
 * @returns {Promise<User>}
 */
const createUser = async (profile) => {
  const user = await getUser(profile.username);

  if (user) {
    return user;
  }

  return User.create({
    name: profile.displayName || profile.username,
    email: profile._json.email,
    github: {
      id: profile.nodeId,
      username: profile.username,
      emails: profile.emails.map((email) => email.value),
      photos: profile.photos.map((photo) => photo.value),
      company: profile._json.company,
      bio: profile._json.bio,
    },
  });
};

/**
 * Update user by discordId
 * @param {Object} profile
 * @returns {Promise<User>}
 */

const updateUserDiscordByUserId = async (userId, profile) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.discord = {
    id: profile.id,
  };

  await user.save();

  return user;
};

const addIssue = async (username, issue, type) => {
  const user = await getUser(username);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const subIssue = {
    issueId: issue.issueId,
    number: issue.number,
    title: issue.title,
    url: issue.url,
    creator: issue.creator,
    thread: issue.thread,
    price: issue.price,
    created_at: issue.created_at,
  };

  const issueSolved = user.issues.solved.find((i) => i.issueId === subIssue.issueId);
  const issueAssigned = user.issues.assigned.find((i) => i.issueId === subIssue.issueId);
  const issueClosed = user.issues.closed.find((i) => i.issueId === subIssue.issueId);

  if (issueSolved) {
    user.issues.solved = user.issues.solved.filter((i) => i.issueId !== subIssue.issueId);
  }
  if (issueAssigned) {
    user.issues.assigned = user.issues.assigned.filter((i) => i.issueId !== subIssue.issueId);
  }
  if (issueClosed) {
    user.issues.closed = user.issues.closed.filter((i) => i.issueId !== subIssue.issueId);
  }

  switch (type) {
    case 'solved':
      user.issues.solved.push(subIssue);
      break;
    case 'assigned':
      user.issues.assigned.push(subIssue);
      break;
    case 'closed':
      user.issues.closed.push(subIssue);
      break;
    default:
      break;
  }

  await user.save();

  return user;
};

/**
 * Get user by discordId
 * @param {string} discordId
 * @returns {Promise<User>}
 */
const getUserByDiscordId = async (discordId) => {
  return User.findOne({ 'discord.id': discordId });
};

const getContributedProjects = async (username) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const totalContributions = await Issue.aggregate([
    {
      $match: {
        'creator.login': username,
        solved: true,
      },
    },
    {
      $group: {
        _id: '$repositoryId',
        project: { $first: '$owner' },
        count: { $sum: 1 },
        bounty: { $sum: '$price' },
      },
    },
  ]);

  return totalContributions;
};

module.exports = {
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  createUser,
  getUserByDiscordId,
  getUser,
  addIssue,
  getContributedProjects,
  updateUserDiscordByUserId,
};
