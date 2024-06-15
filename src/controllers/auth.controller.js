const httpStatus = require('http-status');
const passport = require('passport');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, userService } = require('../services');

const githubCallback = catchAsync(async (req, res) => {
  const { user } = req;
  const tokens = await tokenService.generateAuthTokens(user);
  res.redirect(`${config.frontendUrl}/auth/callback?token=${tokens.access.token}`);
});

const discord = catchAsync(async (req, res, next) => {
  passport.authenticate('discord', {
    state: JSON.stringify({ id: req.authUser.id }),
  })(req, res, next);
});

const discordCallback = catchAsync(async (req, res) => {
  const { profile } = req.authInfo;
  const { id } = JSON.parse(req.query.state);
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
