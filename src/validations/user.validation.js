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

module.exports = {
  getContributedProjects,
  getUsers,
  getUser,
};
