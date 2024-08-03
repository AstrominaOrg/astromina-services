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

const getUser = async (username) => {
  return User.findOne({ 'github.username': username });
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

const updateProfile = async (username, updateBody) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
  await user.deleteOne();
  return user;
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
    email: profile._json.email ? profile._json.email : '',
    bio: profile._json.bio,
    github: {
      id: profile.nodeId,
      username: profile.username,
      emails: profile.emails ? profile.emails.map((email) => email.value) : [],
      photos: profile.photos.map((photo) => photo.value),
      company: profile._json.company,
      avatar_url: profile._json.avatar_url,
    },
    twitter: {
      url: `https://x.com/${profile.username}`,
    },
    website: {
      url: profile._json.blog,
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
    username: profile.username,
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

const getContributedProjects = async (username, authUser) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const match = {
    'assignees.login': username,
    solved: true,
  };

  if (authUser) {
    const authUserLogin = authUser.github.username;
    match.$or = [{ private: false }, { 'collaborators.login': authUserLogin }];
  } else {
    match.private = false;
  }

  const totalContributions = await Issue.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          ownerLogin: '$owner.login',
          repositoryName: '$repository.name',
        },
        count: { $sum: 1 },
        bounty: { $sum: '$price' },
        avatar_url: { $first: '$owner.avatar_url' },
      },
    },
    {
      $group: {
        _id: '$_id.ownerLogin',
        repositories: {
          $push: {
            repositoryName: '$_id.repositoryName',
            count: '$count',
            bounty: '$bounty',
            avatar_url: '$avatar_url',
          },
        },
        totalIssues: { $sum: '$count' },
        totalBounty: { $sum: '$bounty' },
      },
    },
    {
      $project: {
        _id: 0,
        owner: '$_id',
        totalIssues: 1,
        totalBounty: 1,
        repositories: 1,
      },
    },
  ]);

  const totalCount = totalContributions.reduce((acc, curr) => acc + curr.totalIssues, 0);
  const totalContributionsRepository = totalContributions.flatMap((contribution) => contribution.repositories).length;
  const totalBounty = totalContributions.reduce((acc, curr) => acc + curr.totalBounty, 0);

  return {
    totalContributionsProjects: totalContributions.length,
    totalContributionsCount: totalCount,
    totalContributionsRepository,
    totalBounty,
    projects: totalContributions,
  };
};

const getManagedIssues = async (username, filter, options) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const managedIssues = Issue.paginate({ 'managers.login': username, ...filter }, options);

  return managedIssues;
};

const getAssignedIssues = async (username, filter, options) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const managedIssues = Issue.paginate({ 'assignees.login': username, ...filter }, options);

  return managedIssues;
};

const markUserAsRewarded = async (id, issueId) => {
  const user = await getUserByDiscordId(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const issue = await Issue.findOne({ issueId });
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  const isAssigned = issue.assignees.find((assignee) => assignee.login === user.github.username);
  if (!isAssigned) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is not assigned to issue');
  }
  const isSolved = issue.solved;
  if (!isSolved) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Issue is not solved');
  }
  const isRewarded = issue.assignees.find((assignee) => assignee.login === user.github.username && assignee.rewarded);
  if (isRewarded) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already rewarded');
  }

  const assignee = issue.assignees.find((dev) => dev.login === user.github.username);
  assignee.rewarded = true;

  const allAssigneesRewarded = issue.assignees.every((dev) => dev.rewarded);
  if (allAssigneesRewarded) {
    issue.rewarded = true;
  }

  await issue.save();
};

module.exports = {
  getUser,
  addIssue,
  queryUsers,
  createUser,
  getUserById,
  updateProfile,
  updateUserById,
  deleteUserById,
  getUserByEmail,
  getManagedIssues,
  getAssignedIssues,
  markUserAsRewarded,
  getUserByDiscordId,
  getContributedProjects,
  updateUserDiscordByUserId,
};
