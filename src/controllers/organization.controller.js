const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { organizationService, githubService } = require('../services');
const logger = require('../config/logger');
const config = require('../config/config');

const getOrganizations = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'state']);

  if (req.query.name) {
    filter.name = { $regex: req.query.name, $options: 'i' };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const organizations = await organizationService.queryOrganizations(filter, options);

  const authUserLogin = req.authUser ? req.authUser.github.username : null;

  const filteredOrganizations = organizations.results.map((organization) => {
    const newOrganization = { ...organization._doc };

    if (authUserLogin !== null) {
      logger.info('authUserLogin', authUserLogin);
      const isMember = newOrganization.members.some((member) => member.login === authUserLogin);
      if (!isMember) {
        logger.info('isMember', isMember);
        newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
      }
    } else {
      logger.info('authUserLogin, no user');
      newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
    }

    return newOrganization;
  });

  res.send({
    results: filteredOrganizations,
    page: organizations.page,
    limit: organizations.limit,
    totalPages: organizations.totalPages,
    totalResults: organizations.totalResults,
  });
});

const getOrganization = catchAsync(async (req, res) => {
  const organization = await organizationService.getOrganization(req.params.organizationId);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }

  const authUserLogin = req.authUser ? req.authUser.github.username : null;
  const newOrganization = { ...organization._doc };

  if (authUserLogin) {
    const isMember = newOrganization.members.some((member) => member.login === authUserLogin);
    if (!isMember) {
      newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
    }
  } else {
    newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
  }

  res.send(newOrganization);
});

const getOrganizationByName = catchAsync(async (req, res) => {
  const organization = await organizationService.getOrganizationByName(req.params.organizationName);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }

  const authUserLogin = req.authUser ? req.authUser.github.username : null;
  const newOrganization = { ...organization._doc };

  if (authUserLogin) {
    const isMember = newOrganization.members.some((member) => member.login === authUserLogin);
    if (!isMember) {
      newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
    }
  } else {
    newOrganization.members = newOrganization.members.filter((member) => !member.visibility === 'public');
  }

  res.send(newOrganization);
});

const getTopContributors = catchAsync(async (req, res) => {
  const result = await organizationService.getTopContributors(req.params.organizationName, req.authUser);
  res.send(result);
});

const updateProfile = catchAsync(async (req, res) => {
  const organization = await organizationService.updateProfile(req.params.organizationName, req.body);
  res.send(organization);
});

const redirect = catchAsync(async (req, res) => {
  const organization = await githubService.getInstallation(req.query.installation_id);

  res.redirect(`${config.frontendUrl}/organization/${organization.login}`);
});

module.exports = {
  redirect,
  getTopContributors,
  updateProfile,
  getOrganizations,
  getOrganization,
  getOrganizationByName,
};
