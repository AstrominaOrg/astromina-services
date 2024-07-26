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
    bio: Joi.string().allow(''),
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
    availableDays: Joi.number(),
    location: Joi.string(),
    skills: Joi.array().items(Joi.string()),
  }),
};

module.exports = {
  updateProfile,
  getBountyTotals,
  getOrganization,
  getOrganizations,
  getTopContributors,
};
