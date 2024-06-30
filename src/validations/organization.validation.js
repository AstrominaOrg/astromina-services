const Joi = require('joi');

const getOrganizations = {
  query: Joi.object().keys({
    title: Joi.string(),
    url: Joi.string(),
    state: Joi.string().valid('pending', 'accepted', 'rejected'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOrganization = {
  params: Joi.object().keys({
    organizationName: Joi.string().required(),
  }),
};

const getTopContributors = {
  params: Joi.object().keys({
    organizationName: Joi.string().required(),
  }),
};

const getBountyTotals = {
  params: Joi.object().keys({
    organizationName: Joi.string().required(),
  }),
};

module.exports = {
  getOrganizations,
  getOrganization,
  getTopContributors,
  getBountyTotals,
};
