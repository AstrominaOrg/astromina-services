const httpStatus = require('http-status');
const passport = require('passport');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { authService, tokenService, userService, emailService, adminService, discordService } = require('../services');
const oneTimePassword = require('../config/otp');
const { randomState } = require('../utils/crypto.utils');
const { set, get } = require('../config/redis');

const github = catchAsync(async (req, res, next) => {
  const state = randomState();
  await set(state, { valid: true }, 300);

  passport.authenticate('github', {
    state,
  })(req, res, next);
});

const githubCallback = catchAsync(async (req, res) => {
  const { state } = req.query;

  const stateInCache = await get(state);

  if (!stateInCache) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid state');
  }

  const { user } = req;
  const tokens = await tokenService.generateAuthTokens(user);

  res.cookie('accessToken', tokens.access.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  res.cookie('refreshToken', tokens.refresh.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  if (user.discord && user.discord.id) {
    res.redirect(`${config.frontendUrl}`);
  } else {
    res.redirect(`${config.redirectUrl}`);
  }
});

const discord = catchAsync(async (req, res, next) => {
  const state = randomState();
  await set(state, JSON.stringify({ id: req.authUser.id }), 300);
  passport.authenticate('discord', {
    state,
  })(req, res, next);
});

const discordCallback = catchAsync(async (req, res) => {
  const { state } = req.query;
  const stateInCache = await get(state);

  if (!stateInCache) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid state');
  }

  const { profile } = req.authInfo;
  const { id } = JSON.parse(stateInCache);
  await userService.updateUserDiscordByUserId(id, profile);
  await discordService.recoverUsersThreads(id);

  res.redirect(`${config.redirectUrl}`);
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.headers['refresh-token'];

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  await authService.logout(refreshToken);

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.headers['refresh-token'];

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const tokens = await authService.refreshAuth(refreshToken);

  res.cookie('accessToken', tokens.access.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  res.cookie('refreshToken', tokens.refresh.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const sendOtp = catchAsync(async (req, res) => {
  const otp = oneTimePassword.generate();
  await set(req.body.email, otp, 300);
  await emailService.sendEmail(req.body.email, 'OTP', otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const admin = await adminService.getAdminByEmail(email);
  const otpInCache = await get(email);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No admin found with this email');
  }
  if (otpInCache !== otp) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect OTP');
  }

  const tokens = await tokenService.generateAdminAuthTokens(admin);

  res.send({ ...tokens });
});

module.exports = {
  github,
  discord,
  githubCallback,
  discordCallback,
  logout,
  refreshTokens,
  sendOtp,
  verifyOtp,
};
