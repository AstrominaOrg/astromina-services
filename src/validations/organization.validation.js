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
    twitter: Joi.object()
      .keys({
        url: Joi.string().uri().allow(''),
      })
      .optional(),
    website: Joi.object()
      .keys({
        url: Joi.string().uri().allow(''),
      })
      .optional(),
    telegram: Joi.object()
      .keys({
        url: Joi.string().uri().allow(''),
      })
      .optional(),
    linkedin: Joi.object()
      .keys({
        url: Joi.string().uri().allow(''),
      })
      .optional(),
    discord: Joi.object()
      .keys({
        url: Joi.string().uri().allow(''),
      })
      .optional(),
  }),
};

module.exports = {
  updateProfile,
  getBountyTotals,
  getOrganization,
  getOrganizations,
  getTopContributors,
};
