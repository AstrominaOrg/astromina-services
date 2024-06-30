const Joi = require('joi');

const getRepositories = {
  query: Joi.object().keys({
    name: Joi.string(),
    full_name: Joi.string(),
    ownerLogin: Joi.string(),
    type: Joi.string().valid('Organization', 'User'),
    private: Joi.boolean(),
    state: Joi.string().valid('pending', 'accepted', 'rejected', 'deleted'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRepository = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
};

module.exports = {
  getRepositories,
  getRepository,
};
