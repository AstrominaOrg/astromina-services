const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const { Token } = require('../models');
const { tokenTypes } = require('../config/tokens');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} admin
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, admin = false, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    admin,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @param {boolean} [admin]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, admin = false, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
    admin,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type, admin = false) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false, admin });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS, false);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH, false);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH, false);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate auth tokens for the admin
 * @param {Admin} admin
 * @returns {Promise<Object>}
 */
const generateAdminAuthTokens = async (admin) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutesAdmin, 'minutes');
  const accessToken = generateToken(admin.id, accessTokenExpires, tokenTypes.ACCESS, true);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationMinutesAdmin, 'minutes');
  const refreshToken = generateToken(admin.id, refreshTokenExpires, tokenTypes.REFRESH, true);
  await saveToken(refreshToken, admin.id, refreshTokenExpires, tokenTypes.REFRESH, true);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateAdminAuthTokens,
};
