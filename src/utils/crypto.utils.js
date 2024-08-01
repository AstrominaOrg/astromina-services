const crypto = require('crypto');

const randomState = () => crypto.randomBytes(16).toString('hex');

module.exports = {
  randomState,
};
