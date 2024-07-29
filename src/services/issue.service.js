const httpStatus = require('http-status');
const { Issue } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create an issue
 * @param {Object} issueBody
 * @returns {Promise<Issue>}
 */
const createIssue = async (issueBody) => {
  return Issue.create(issueBody);
};

/**
 * Query for issues
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryIssues = async (filter, options) => {
  logger.info(`Querying issues with filter: ${JSON.stringify(filter)} and options: ${JSON.stringify(options)}`);
  const issues = await Issue.paginate(filter, options);
  return issues;
};

/**
 * @param {String} issueId
 * @returns {Promise<Issue>}
 */
async function getIssue(issueId) {
  const issue = await queryIssues({ issueId }, { limit: 1 });

  return issue.results[0];
}

/**
 * @param {String} issueNumber
 * @param {String} repositoryId
 * @returns {Promise<Issue>}
 */
async function getIssueByIssueNumberAndRepositoryId(issueNumber, repositoryId) {
  const issue = await queryIssues({ number: issueNumber, 'repository.id': repositoryId }, { limit: 1 });

  return issue.results[0];
}

async function getIssueByOwnerAndRepoAndIssueNumber(owner, repo, issueNumber) {
  const issue = await queryIssues({ 'owner.login': owner, 'repository.name': repo, number: issueNumber }, { limit: 1 });

  return issue.results[0];
}

async function updateRepositoryIssuesVisibility(repositoryId, isPrivate) {
  await Issue.updateMany({ 'repository.id': repositoryId }, { private: isPrivate });
}

async function deleteRepositoryIssues(repositoryId) {
  await Issue.deleteMany({ 'repository.id': repositoryId });
}

/**
 * Update issue by id
 * @param {ObjectId} issueId
 * @param {Object} updateBody
 * @returns {Promise<Issue>}
 */
const updateIssue = async (issueId, updateBody) => {
  const issue = await getIssue(issueId);
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  Object.assign(issue, updateBody);
  await issue.save();
  return issue;
};

/**
 * Delete issue by id
 * @param {ObjectId} issueId
 * @returns {Promise<Issue>}
 */
const deleteIssue = async (issueId) => {
  const issue = await getIssue(issueId);
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  await issue.remove();
  return issue;
};

/**
 * Create or update an issue
 * @param {Object} issueBody
 * @returns {Promise<Issue>}
 */
async function createOrUpdateIssue(issueBody) {
  const issue = await getIssue(issueBody.issueId);

  if (issue) {
    return updateIssue(issueBody.issueId, issueBody);
  }
  return createIssue(issueBody);
}

async function markIssueAsSolved(issueId) {
  return updateIssue(issueId, { solved: true, solved_at: new Date() });
}

async function updatePrice(issueId, price, priceManager) {
  const issue = await getIssue(issueId);

  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }

  issue.managers.push({
    login: priceManager.login,
    avatar_url: priceManager.avatar_url || priceManager.avatarUrl,
  });
  issue.price = price;

  await issue.save();
}

async function addManager(issueId, manager) {
  const issue = await getIssue(issueId);

  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }

  issue.managers.push(manager);

  await issue.save();
}

module.exports = {
  getIssue,
  addManager,
  updatePrice,
  createIssue,
  queryIssues,
  updateIssue,
  deleteIssue,
  markIssueAsSolved,
  createOrUpdateIssue,
  deleteRepositoryIssues,
  updateRepositoryIssuesVisibility,
  getIssueByIssueNumberAndRepositoryId,
  getIssueByOwnerAndRepoAndIssueNumber,
};
