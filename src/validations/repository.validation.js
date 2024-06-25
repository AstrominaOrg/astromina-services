const Joi = require('joi');

const createRepository = {
  body: Joi.object().keys({
    repositoryId: Joi.number().required(),
    name: Joi.string().required(),
    full_name: Joi.string().required(),
    owner: Joi.string().required(),
    type: Joi.string().required().valid('Organization', 'User'),
    description: Joi.string().allow(''),
    private: Joi.boolean().required(),
    avatar_url: Joi.string(),
    state: Joi.string().required().valid('pending', 'accepted', 'rejected', 'deleted'),
    stars: Joi.number().integer().min(0),
    forks: Joi.number().integer().min(0),
  }),
};

const getRepositories = {
  query: Joi.object().keys({
    name: Joi.string(),
    full_name: Joi.string(),
    owner: Joi.string(),
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
    repositoryId: Joi.number().integer().required(),
  }),
};

const updateRepository = {
  params: Joi.object().keys({
    repositoryId: Joi.number().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      full_name: Joi.string(),
      owner: Joi.string(),
      type: Joi.string().valid('Organization', 'User'),
      description: Joi.string(),
      private: Joi.boolean(),
      avatar_url: Joi.string(),
      state: Joi.string().valid('pending', 'accepted', 'rejected', 'deleted'),
      stars: Joi.number().integer().min(0),
      forks: Joi.number().integer().min(0),
    })
    .min(1),
};

const deleteRepository = {
  params: Joi.object().keys({
    repositoryId: Joi.number().required(),
  }),
};

module.exports = {
  createRepository,
  getRepositories,
  getRepository,
  updateRepository,
  deleteRepository,
};
