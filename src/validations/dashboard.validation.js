const Joi = require('joi');

const leaderboard = {
  query: Joi.object().keys({
    api_key: Joi.string().required(),
  }),
};

module.exports = {
  leaderboard,
};
