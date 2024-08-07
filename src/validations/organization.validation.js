const Joi = require('joi');

const getOrganizations = {
  query: Joi.object().keys({
    name: Joi.string(),
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

const updateProfile = {
  body: Joi.object().keys({
    description: Joi.string().allow(''),
    discord: Joi.object().keys({
      url: Joi.string().allow(''),
    }),
    twitter: Joi.object().keys({
      url: Joi.string().allow(''),
    }),
    website: Joi.object().keys({
      url: Joi.string().allow(''),
    }),
    telegram: Joi.object().keys({
      url: Joi.string().allow(''),
    }),
    linkedin: Joi.object().keys({
      url: Joi.string().allow(''),
    }),
  }),
};

module.exports = {
  updateProfile,
  getBountyTotals,
  getOrganization,
  getOrganizations,
  getTopContributors,
};
