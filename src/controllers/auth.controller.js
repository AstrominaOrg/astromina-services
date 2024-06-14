const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, userService } = require('../services');
const logger = require('../config/logger');

const githubCallback = catchAsync(async (req, res) => {
  const { user } = req;
  const tokens = await tokenService.generateAuthTokens(user);
  res.redirect(`/v1/docs?token=${tokens.access.token}`);
});

const discord = catchAsync(async (req, res, next) => {
  req.session.userId = req.authUser._id;
  next();
});

const discordCallback = catchAsync(async (req, res) => {
  const { profile } = req.authInfo;
  const id = req.session.userId;
  logger.info(`Discord callback for user ${id}`);
  await userService.updateUserDiscordByUserId(id, profile);
  res.redirect(`/v1/docs`);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

module.exports = {
  discord,
  githubCallback,
  discordCallback,
  logout,
  refreshTokens,
};
