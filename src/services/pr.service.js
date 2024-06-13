const httpStatus = require('http-status');
const { PullRequest } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a pull request
 * @param {Object} prBody
 * @returns {Promise<PullRequest>}
 */
const createPullRequest = async (prBody) => {
  return PullRequest.create(prBody);
};

/**
 * Query for pull requests
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPullRequests = async (filter, options) => {
  const pullRequests = await PullRequest.paginate(filter, options);
  return pullRequests;
};

/**
 * Get pull request by id
 * @param {ObjectId} id
 * @returns {Promise<PullRequest>}
 */
const getPullRequestById = async (id) => {
  return PullRequest.findById(id);
};

/**
 * Get pull request by pullRequestId
 * @param {String} pullRequestId
 * @returns {Promise<PullRequest>}
 */
const getPullRequestByPullRequestId = async (pullRequestId) => {
  return PullRequest.findOne({ pullRequestId });
};

/**
 * Update pull request by pullRequestId
 * @param {String} pullRequestId
 * @param {Object} updateBody
 * @returns {Promise<PullRequest>}
 */
const updatePullRequestByPullRequestId = async (pullRequestId, updateBody) => {
  const pullRequest = await getPullRequestByPullRequestId(pullRequestId);
  if (!pullRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Pull request not found');
  }
  Object.assign(pullRequest, updateBody);
  await pullRequest.save();
  return pullRequest;
};

/**
 * Delete pull request by pullRequestId
 * @param {String} pullRequestId
 * @returns {Promise<PullRequest>}
 */
const deletePullRequestByPullRequestId = async (pullRequestId) => {
  const pullRequest = await getPullRequestByPullRequestId(pullRequestId);
  if (!pullRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Pull request not found');
  }
  await pullRequest.remove();
  return pullRequest;
};

/**
 * Create or update a pull request
 * @param {Object} prBody
 * @returns {Promise<PullRequest>}
 */
const createOrUpdatePullRequest = async (prBody) => {
  const pullRequest = await getPullRequestByPullRequestId(prBody.pullRequestId);
  if (pullRequest) {
    return updatePullRequestByPullRequestId(prBody.pullRequestId, prBody);
  }
  return createPullRequest(prBody);
};

module.exports = {
  createPullRequest,
  queryPullRequests,
  getPullRequestById,
  getPullRequestByPullRequestId,
  updatePullRequestByPullRequestId,
  deletePullRequestByPullRequestId,
  createOrUpdatePullRequest,
};
