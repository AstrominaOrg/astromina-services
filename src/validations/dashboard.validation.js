const Joi = require('joi');

const leaderboard = {
  query: Joi.object().keys({
    api_key: Joi.string().required(),
  }),
};

const setIssueRewarded = {
  query: Joi.object().keys({
    api_key: Joi.string().required(),
    organization: Joi.string().required(),
    repository: Joi.string().required(),
    issue: Joi.number().required(),
    rewarded: Joi.boolean().required(),
  }),
};

module.exports = {
  leaderboard,
  setIssueRewarded,
};
