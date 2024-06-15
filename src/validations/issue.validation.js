const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createIssue = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    state: Joi.string().required().valid('open', 'closed'),
    assignee: Joi.string(),
    price: Joi.number().integer().min(0),
    token: Joi.string().required(),
  }),
};

const getIssues = {
  query: Joi.object().keys({
    title: Joi.string(),
    state: Joi.string().valid('open', 'closed'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    token: Joi.string().required(),
  }),
};

const getIssue = {
  params: Joi.object().keys({
    issueId: Joi.string().custom(objectId),
    token: Joi.string().required(),
  }),
};

const updateIssue = {
  params: Joi.object().keys({
    issueId: Joi.required().custom(objectId),
    token: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      state: Joi.string().valid('open', 'closed'),
      assignee: Joi.string(),
      price: Joi.number().integer().min(0),
    })
    .min(1),
};

const deleteIssue = {
  params: Joi.object().keys({
    issueId: Joi.string().custom(objectId),
    token: Joi.string().required(),
  }),
};

module.exports = {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  deleteIssue,
};
