const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { organizationService } = require('../services');

const getOrganizations = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'state']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await organizationService.queryOrganizations(filter, options);
  res.send(result);
});

const getOrganization = catchAsync(async (req, res) => {
  const organization = await organizationService.getOrganization(req.params.organizationId);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }
  res.send(organization);
});

const getOrganizationByName = catchAsync(async (req, res) => {
  const organization = await organizationService.getOrganizationByName(req.params.organizationName);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Organization not found');
  }
  res.send(organization);
});

const getTopContributors = catchAsync(async (req, res) => {
  const result = await organizationService.getTopContributors(req.params.organizationName);
  res.send(result);
});

const getBountyTotals = catchAsync(async (req, res) => {
  const { totalRewarded, totalActive } = await organizationService.getBountyTotals(req.params.organizationName);
  res.send({ totalRewarded, totalActive });
});

module.exports = {
  getTopContributors,
  getBountyTotals,
  getOrganizations,
  getOrganization,
  getOrganizationByName,
};
