const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, githubService, organizationService, issueService } = require('../services');
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
  const result = await userService.getContributedProjects(req.params.username);
  res.send(result);
});

const getUserGithubActivity = catchAsync(async (req, res) => {
  const result = await githubService.getUserContributions(req.params.username);
  set(req.originalUrl, result, 24 * 60 * 60);
  res.send(result);
});

const getUserActivity = catchAsync(async (req, res) => {
  const result = await issueService.queryIssues(
    { assignees: { $elemMatch: { login: req.params.username } }, state: 'closed', solved: true },
    { limit: 5, sortBy: 'solved_at:desc' }
  );
  res.send(result);
});

const getMyProjects = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await organizationService.getManagedProjects(req.authUser.github.username, options);
  res.send(result);
});

const getMyManagedIssues = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getManagedIssues(req.authUser.github.username, options);
  res.send(result);
});

const getMyAssignedIssues = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getAssignedIssues(req.authUser.github.username, options);
  res.send(result);
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.authUser.github.username, req.body);
  res.send(user);
});

module.exports = {
  getContributedProjects,
  getUserGithubActivity,
  getMyAssignedIssues,
  getMyManagedIssues,
  getUserActivity,
  updateProfile,
  getMyProjects,
  getUsers,
  getUser,
  getMe,
};
