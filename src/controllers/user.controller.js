const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, githubService, organizationService, issueService, discordService } = require('../services');
const { set } = require('../config/redis');

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const getMe = catchAsync(async (req, res) => {
  res.send(req.authUser);
});

const getContributedProjects = catchAsync(async (req, res) => {
  const result = await userService.getContributedProjects(req.params.username, req.authUser);
  res.send(result);
});

const getUserGithubActivity = catchAsync(async (req, res) => {
  const result = await githubService.getUserContributions(req.params.username);
  if (result) {
    set(req.originalUrl, result, 24 * 60 * 60);
    res.send(result);
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
});

const getUserActivity = catchAsync(async (req, res) => {
  const filter = {
    assignees: { $elemMatch: { login: req.params.username } },
    state: 'closed',
    solved: true,
  };

  if (req.authUser) {
    const authUserLogin = req.authUser.github.username;
    filter.$or = [{ private: false }, { 'collaborators.login': authUserLogin }];
  } else {
    filter.private = false;
  }

  const options = { limit: 5, sortBy: 'solved_at:desc' };
  const result = await issueService.queryIssues(filter, options);
  res.send(result);
});

const getMyProjects = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await organizationService.getManagedProjects(req.authUser.github.username, options);
  res.send(result);
});

const getMyManagedIssues = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'rewarded', 'solved']);

  if (req.query.ownerLogin) {
    filter['owner.login'] = req.query.ownerLogin;
  }

  if (req.query.untouched) {
    filter.assignees = { $size: 0 };
  } else if (req.query.touched) {
    filter.assignees = { $gt: [] };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getManagedIssues(req.authUser.github.username, filter, options);
  res.send(result);
});

const getMyAssignedIssues = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'rewarded', 'solved']);

  if (req.query.ownerLogin) {
    filter['owner.login'] = req.query.ownerLogin;
  }

  if (req.query.untouched) {
    filter.assignees = { $size: 0 };
  } else if (req.query.touched) {
    filter.assignees = { $gt: [] };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getAssignedIssues(req.authUser.github.username, filter, options);
  res.send(result);
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.authUser.github.username, req.body);
  res.send(user);
});

const isDiscordMember = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.discord || !user.discord.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User has not linked Discord');
  }

  try {
    const result = await discordService.isMember('1192134370463592529');
    res.send(result);
  } catch (error) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not a member of the Discord server');
  }
});

module.exports = {
  getContributedProjects,
  getUserGithubActivity,
  getMyAssignedIssues,
  getMyManagedIssues,
  isDiscordMember,
  getUserActivity,
  updateProfile,
  getMyProjects,
  getUsers,
  getUser,
  getMe,
};
