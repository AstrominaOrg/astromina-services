const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

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

/**
 * Find user by githubId
 * @param {string} githubId
 * @returns {Promise<User>}
 */
const getUserByGithubId = async (githubId) => {
  return User.findOne({ 'github.id': githubId });
};

/**
 * Create or update user by githubId
 * @param {Object} profile
 * @returns {Promise<User>}
 */
const createUserByGithubId = async (profile) => {
  const user = await getUserByGithubId(profile.id);

  if (user) {
    return user;
  }

  return User.create({
    name: profile.displayName || profile.username,
    email: profile._json.email,
    github: {
      id: profile.id,
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

/**
 * Get user by discordId
 * @param {string} discordId
 * @returns {Promise<User>}
 */
const getUserByDiscordId = async (discordId) => {
  return User.findOne({ 'discord.id': discordId });
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  createUserByGithubId,
  getUserByDiscordId,
  getUserByGithubId,
  updateUserDiscordByUserId,
};
