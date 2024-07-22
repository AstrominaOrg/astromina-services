const httpStatus = require('http-status');
const { Organization, Issue } = require('../models');
const ApiError = require('../utils/ApiError');
const { getUser } = require('./user.service');

/**
 * Create an organization
 * @param {Object} organizationBody
 * @returns {Promise<Organization>}
 */
const createOrganization = async (organizationBody) => {
  return Organization.create(organizationBody);
};

/**
 * Query for organizations
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryOrganizations = async (filter, options) => {
  const organizations = await Organization.paginate(filter, options);
  return organizations;
};

async function getOrganization(organizationId) {
  return Organization.findOne({ organizationId });
}

async function getOrganizationByName(organizationName) {
  return Organization.findOne({ title: organizationName });
}

/**
 * Update organization by id
 * @param {ObjectId} organizationId
 * @param {Object} updateBody
 * @returns {Promise<Organization>}
 */
const updateOrganizationById = async (organizationId, updateBody) => {
  const organization = await getOrganization(organizationId);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }
  Object.assign(organization, updateBody);
  await organization.save();
  return organization;
};

const updateProfile = async (organizationName, updateBody) => {
  const organization = await getOrganizationByName(organizationName);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }
  Object.assign(organization, updateBody);
  await organization.save();
  return organization;
};

/**
 * Delete organization by id
 * @param {ObjectId} organizationId
 * @returns {Promise<Organization>}
 */
const deleteOrganizationById = async (organizationId) => {
  const organization = await getOrganization(organizationId);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }
  await organization.remove();
  return organization;
};

/**
 * Update organization members
 * @param {ObjectId} organizationId
 * @param {Array} members
 */
const updateOrganizationMembers = async (organizationId, members) => {
  const organization = await getOrganization(organizationId);

  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }

  organization.members = members.map((member) => ({
    login: member.login,
    avatar_url: member.avatar_url,
    role: member.role,
    canEdit:
      organization.members && organization.members.find((m) => m.login === member.login)
        ? organization.members.find((m) => m.login === member.login).canEdit
        : false,
  }));

  await organization.save();
  return organization;
};

const getTopContributors = async (organizationName) => {
  const organization = await getOrganizationByName(organizationName);

  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }

  const contributorMap = {};

  const issues = await Issue.find({ 'owner.login': organizationName }).lean();
  issues.forEach((issue) => {
    issue.assignees.forEach((assignee) => {
      const key = assignee.login;
      if (contributorMap[key]) {
        contributorMap[key].count += 1;
        contributorMap[key].bounty += issue.price;
      } else {
        contributorMap[key] = {
          login: assignee.login,
          avatar_url: assignee.avatar_url,
          count: 1,
          bounty: issue.price,
        };
      }
    });
  });

  const contributors = Object.values(contributorMap);
  contributors.sort((a, b) => b.count - a.count);

  return contributors.slice(0, 10);
};

const getBountyTotals = async (organizationName) => {
  const organization = await getOrganizationByName(organizationName);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }

  let totalRewarded = 0;
  let totalActive = 0;

  const issues = await Issue.find({ 'owner.login': organizationName }).lean();
  issues.forEach((issue) => {
    if (issue.solved) {
      totalRewarded += issue.price;
    } else {
      totalActive += issue.price;
    }
  });

  return { totalRewarded, totalActive };
};

const createOrUpdateOrganization = async (organizationBody) => {
  const organization = await getOrganization(organizationBody.organizationId);

  if (organization) {
    return updateOrganizationById(organizationBody.organizationId, organizationBody);
  }

  return createOrganization(organizationBody);
};

const getManagedProjects = async (username, options) => {
  const user = await getUser(username);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const organizations = await Organization.paginate({ 'members.login': username }, options);

  return organizations;
};

const isMember = async (organizationName, username) => {
  const organization = await getOrganizationByName(organizationName);
  if (!organization) {
    return false;
  }

  return organization.members.some((member) => member.login === username);
};

module.exports = {
  isMember,
  updateProfile,
  getOrganization,
  getBountyTotals,
  getTopContributors,
  queryOrganizations,
  getManagedProjects,
  createOrganization,
  getOrganizationByName,
  updateOrganizationById,
  deleteOrganizationById,
  updateOrganizationMembers,
  createOrUpdateOrganization,
};
