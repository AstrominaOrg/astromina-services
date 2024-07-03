const Joi = require('joi');

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
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
    bio: Joi.string(),
    twitter: Joi.object().keys({
      url: Joi.string(),
    }),
    website: Joi.object().keys({
      url: Joi.string(),
    }),
    telegram: Joi.object().keys({
      url: Joi.string(),
    }),
    linkedin: Joi.object().keys({
      url: Joi.string(),
    }),
    availableDays: Joi.number(),
    location: Joi.string(),
    skills: Joi.array().items(Joi.string()),
  }),
};

module.exports = {
  getContributedProjects,
  updateProfile,
  getUsers,
  getUser,
};
