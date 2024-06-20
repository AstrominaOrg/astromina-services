const httpStatus = require('http-status');
const { Issue } = require('../models');
const ApiError = require('../utils/ApiError');

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
  const issues = await Issue.paginate(filter, options);
  return issues;
};

/**
 * Get issue by id
 * @param {ObjectId} id
 * @returns {Promise<Issue>}
 */
const getIssueById = async (id) => {
  return Issue.findById(id);
};

/**
 * @param {String} issueId
 * @returns {Promise<Issue>}
 */
async function getIssueByIssueId(issueId) {
  return Issue.findOne({ issueId });
}

/**
 * @param {String} issueNumber
 * @param {String} repositoryId
 * @returns {Promise<Issue>}
 */
async function getIssueByIssueNumberAndRepositoryId(issueNumber, repositoryId) {
  return Issue.findOne({ number: issueNumber, repositoryId });
}

/**
 * Update issue by id
 * @param {ObjectId} issueId
 * @param {Object} updateBody
 * @returns {Promise<Issue>}
 */
const updateIssueByIssueId = async (issueId, updateBody) => {
  const issue = await getIssueByIssueId(issueId);
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
const deleteIssueByIssueId = async (issueId) => {
  const issue = await getIssueByIssueId(issueId);
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
  const issue = await getIssueByIssueId(issueBody.issueId);
  if (issue) {
    return updateIssueByIssueId(issueBody.issueId, issueBody);
  }
  return createIssue(issueBody);
}

module.exports = {
  createIssue,
  queryIssues,
  getIssueById,
  getIssueByIssueNumberAndRepositoryId,
  getIssueByIssueId,
  updateIssueByIssueId,
  deleteIssueByIssueId,
  createOrUpdateIssue,
};
