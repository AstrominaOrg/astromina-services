const httpStatus = require('http-status');
const passport = require('passport');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const { ApiError } = require('../utils/ApiError');
const { authService, tokenService, userService, emailService, adminService } = require('../services');
const oneTimePassword = require('../config/otp');
const { set, get } = require('../config/redis');

const githubCallback = catchAsync(async (req, res) => {
  const { user } = req;
  const tokens = await tokenService.generateAuthTokens(user);

  res.cookie('accessToken', tokens.access.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.redirect(`${config.frontendUrl}`);
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
  await userService.recoverUsersThreads(id);
  res.redirect(`${config.frontendUrl}`);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
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
