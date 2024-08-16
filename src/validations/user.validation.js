const Joi = require('joi');

const getUsers = {
  query: Joi.object().keys({
    api_key: Joi.string().required(),
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMyManagedIssues = {
  query: Joi.object().keys({
    name: Joi.string(),
    rewarded: Joi.boolean(),
    solved: Joi.boolean(),
    ownerLogin: Joi.string(),
    touched: Joi.boolean(),
    untouched: Joi.boolean(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

const getMyAssignedIssues = {
  query: Joi.object().keys({
    name: Joi.string(),
    rewarded: Joi.boolean(),
    solved: Joi.boolean(),
    ownerLogin: Joi.string(),
    touched: Joi.boolean(),
    untouched: Joi.boolean(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    username: Joi.string().required(),
  }),
};

const getContributedProjects = {
  params: Joi.object().keys({
    username: Joi.string().required(),
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
    location: Joi.string().allow(''),
    skills: Joi.array().items(Joi.string()),
  }),
};

module.exports = {
  getContributedProjects,
  getMyAssignedIssues,
  getMyManagedIssues,
  updateProfile,
  getUsers,
  getUser,
};
