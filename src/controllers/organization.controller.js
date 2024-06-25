const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { organizationService } = require('../services');

const createOrganization = catchAsync(async (req, res) => {
  const organization = await organizationService.createOrganization(req.body);
  res.status(httpStatus.CREATED).send(organization);
});

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

const updateOrganization = catchAsync(async (req, res) => {
  const organization = await organizationService.updateOrganizationById(req.params.organizationId, req.body);
  res.send(organization);
});

const deleteOrganization = catchAsync(async (req, res) => {
  await organizationService.deleteOrganizationById(req.params.organizationId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
};
