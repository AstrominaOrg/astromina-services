const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { repositoryService } = require('../services');

const createRepository = catchAsync(async (req, res) => {
  const repository = await repositoryService.createRepository(req.body);
  res.status(httpStatus.CREATED).send(repository);
});

const getRepositories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'full_name', 'owner', 'type', 'private', 'state']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await repositoryService.queryRepositories(filter, options);
  res.send(result);
});

const getRepository = catchAsync(async (req, res) => {
  const repository = await repositoryService.getRepositoryByRepoId(req.params.repositoryId);
  if (!repository) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found');
  }
  res.send(repository);
});

const updateRepository = catchAsync(async (req, res) => {
  const repository = await repositoryService.updateRepositoryById(req.params.repositoryId, req.body);
  res.send(repository);
});

const deleteRepository = catchAsync(async (req, res) => {
  await repositoryService.deleteRepositoryById(req.params.repositoryId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createRepository,
  getRepositories,
  getRepository,
  updateRepository,
  deleteRepository,
};
