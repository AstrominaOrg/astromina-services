const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { organizationService } = require('../services');

const verifyCallback = (req, resolve) => async (err, user) => {
  if (user) {
    req.authUser = user;
  }

  resolve();
};

const authenticate = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

const authorize =
  (...requiredRights) =>
  async (req, res, next) => {
    if (!req.authUser) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    if (requiredRights.length) {
      const userRights = roleRights.get(req.authUser.role);
      const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
      if (!hasRequiredRights) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    next();
  };

const organizationMember = async (req, res, next) => {
  const { organizationName } = req.params;
  const { username } = req.authUser.github;

  const isMember = await organizationService.isMember(organizationName, username);

  if (!isMember) {
    return res.status(403).send({ message: 'Access denied. You are not a member of this organization.' });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  organizationMember,
};
