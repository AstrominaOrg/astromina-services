const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { repositoryService } = require('../services');

const getRepositories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'full_name', 'owner', 'type', 'private', 'state']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await repositoryService.queryRepositories(filter, options);
  res.send(result);
});

const getRepository = catchAsync(async (req, res) => {
  const repository = await repositoryService.getRepositoryByOwnerAndName(req.params.owner, req.params.repo);
  if (!repository) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found');
  }
  res.send(repository);
});

module.exports = {
  getRepositories,
  getRepository,
};
