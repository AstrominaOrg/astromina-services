const httpStatus = require('http-status');
const { Organization } = require('../models');
const ApiError = require('../utils/ApiError');

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
    id: member.id,
    role: member.role,
    canEdit:
      organization.members && organization.members.find((m) => m.id === member.id)
        ? organization.members.find((m) => m.id === member.id).canEdit
        : false,
  }));

  await organization.save();
  return organization;
};

module.exports = {
  createOrganization,
  queryOrganizations,
  updateOrganizationMembers,
  getOrganization,
  updateOrganizationById,
  deleteOrganizationById,
};
