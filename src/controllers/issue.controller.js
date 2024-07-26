const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { issueService } = require('../services');

const getIssues = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'issueId',
    'number',
    'title',
    'description',
    'repositoryId',
    'state',
    'owner',
    'solved',
    'rewarded',
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
    filter.assignees = { $elemMatch: { login: { $regex: req.query.assigneeUsername, $options: 'i' } } };
  }

  if (req.query.ownerLogin) {
    filter['owner.login'] = { $regex: req.query.ownerLogin, $options: 'i' };
  }

  if (req.query.managerLogin) {
    filter.managers = { $elemMatch: { login: { $regex: req.query.managerLogin, $options: 'i' } } };
  }

  if (req.query.untouched) {
    filter.assignees = { $size: 0 };
  }
  if (req.query.touched) {
    filter.assignees = { $not: { $size: 0 } };
  }

  if (req.query.repositoryId) {
    filter['repository.id'] = req.query.repositoryId;
  }

  if (req.query.labels) {
    const labels = Array.isArray(req.query.labels) ? req.query.labels : [req.query.labels];
    filter.labels = { $in: labels };
  }

  if (req.query.title) {
    filter.title = { $regex: req.query.title, $options: 'i' };
  }

  if (req.query.hasBounty) {
    filter.price = { $gt: 0 };
  } else if (req.query.hasNoBounty) {
    filter.price = 0;
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await issueService.queryIssues(filter, options);

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
