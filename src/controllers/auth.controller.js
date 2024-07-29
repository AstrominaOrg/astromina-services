const httpStatus = require('http-status');
const passport = require('passport');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { authService, tokenService, userService, emailService, adminService, discordService } = require('../services');
const oneTimePassword = require('../config/otp');
const { set, get } = require('../config/redis');

const githubCallback = catchAsync(async (req, res) => {
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

  res.redirect(`${config.redirectUrl}`);
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
  res.send({ ...tokens });
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
  discord,
  githubCallback,
  discordCallback,
  logout,
  refreshTokens,
  sendOtp,
  verifyOtp,
};
