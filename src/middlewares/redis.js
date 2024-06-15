const client = require('../config/redis');
const logger = require('../config/logger');

const set = async (key, value, duration) => {
  await client.setEx(key, duration, JSON.stringify(value));
};

const get = async (key) => {
  if (!client) {
    return null;
  }

  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const cache = (req, res, next) => {
  const key = req.originalUrl.replace(/&?token=[^&]+/g, '');
  get(key)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        next();
      }
    })
    .catch((err) => {
      logger.error(err);
      next();
    });
};

module.exports = {
  cache,
  set,
  get,
};
