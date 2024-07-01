const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { issueService } = require('../services');
const { set } = require('../config/redis');

const getIssues = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'issueId',
    'number',
    'title',
    'description',
    'repositoryId',
    'state',
    'solved',
    'labels',
    'assignees',
  ]);

  if (req.query.priceMin !== undefined || req.query.priceMax !== undefined) {
    filter.price = {};
    if (req.query.priceMin !== undefined) {
      filter.price.$gte = parseInt(req.query.priceMin, 10);
    }
    if (req.query.priceMax !== undefined) {
      filter.price.$lte = parseInt(req.query.priceMax, 10);
    }
  }

  if (req.query.assigneeUsername) {
    filter.assignees = { $elemMatch: { login: req.query.assigneeUsername } };
  }

  if (req.query.ownerLogin) {
    filter.owner = { login: req.query.ownerLogin };
  }

  if (req.query.managerLogin) {
    filter.managers = { login: req.query.managerLogin };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await issueService.queryIssues(filter, options);

  await set(req.originalUrl, result, 60);
  res.send(result);
});

const getIssue = catchAsync(async (req, res) => {
  const issue = await issueService.getIssueByOwnerAndRepoAndIssueNumber(
    req.params.owner,
    req.params.repo,
    req.params.issueNumber
  );
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  res.send(issue);
});

module.exports = {
  getIssues,
  getIssue,
};
