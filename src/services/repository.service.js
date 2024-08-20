const httpStatus = require('http-status');
const { Repository } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a repository
 * @param {Object} repositoryBody
 * @returns {Promise<Repository>}
 */
const createRepository = async (repositoryBody) => {
  return Repository.create(repositoryBody);
};

/**
 * Query for repositories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryRepositories = async (filter, options) => {
  const repositories = await Repository.paginate(filter, options);
  return repositories;
};

/**
 * Get repository by id
 * @param {ObjectId} id
 * @returns {Promise<Repository>}
 */
const getRepositoryById = async (id) => {
  return Repository.findById(id);
};
/**
 * @param {String} repositoryId
 * @returns {Promise<Repository>}
 */
async function getRepositoryByRepoId(repositoryId) {
  return Repository.findOne({ repositoryId });
}

/**
 * Update repository by id
 * @param {ObjectId} repositoryId
 * @param {Object} updateBody
 * @returns {Promise<Repository>}
 */
const updateRepositoryByRepoId = async (repositoryId, updateBody) => {
  const repository = await getRepositoryByRepoId(repositoryId);
  if (!repository) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found');
  }
  Object.assign(repository, updateBody);
  await repository.save();
  return repository;
};

/**
 * Delete repository by id
 * @param {ObjectId} repositoryId
 * @returns {Promise<Repository>}
 */
const deleteRepositoryById = async (repositoryId) => {
  const repository = await getRepositoryById(repositoryId);
  if (!repository) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found');
  }
  await repository.deleteOne();
  return repository;
};

/**
 * Create or update a repository
 * @param {Object} repositoryBody
 * @returns {Promise<Repository>}
 */
const createOrUpdateRepository = async (repositoryBody) => {
  if (await getRepositoryByRepoId(repositoryBody.repositoryId)) {
    return updateRepositoryByRepoId(repositoryBody.repositoryId, repositoryBody);
  }
  return createRepository(repositoryBody);
};

const getRepositoryByOwnerAndName = async (owner, name) => {
  return Repository.findOne({ 'owner.login': owner, name });
};

const deleteRepositoriesByOwner = async (owner) => {
  return Repository.deleteMany({ 'owner.login': owner });
};

const deleteRepositoryByName = async (owner, name) => {
  return Repository.deleteOne({ 'owner.login': owner, name });
};

module.exports = {
  createRepository,
  queryRepositories,
  getRepositoryById,
  deleteRepositoryById,
  getRepositoryByRepoId,
  deleteRepositoryByName,
  createOrUpdateRepository,
  updateRepositoryByRepoId,
  deleteRepositoriesByOwner,
  getRepositoryByOwnerAndName,
};
