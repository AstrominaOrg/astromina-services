const { get } = require('../config/redis');
const logger = require('../config/logger');

const cache = (req, res, next) => {
  const key = req.originalUrl.replace(/&?token=[^&]+/g, '');
  get(key)
    .then((data) => {
      if (data) {
        logger.info(`Cache hit for key: ${key}`);
        res.send(data);
      } else {
        next();
      }
    })
    .catch((err) => {
      logger.error(`Cache error: ${err}`);
      next();
    });
};

module.exports = {
  cache,
  get,
};
