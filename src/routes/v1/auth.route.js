const express = require('express');
const passport = require('passport');
const validate = require('../../middlewares/validate');
const { authorize, authenticate } = require('../../middlewares/auth');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const config = require('../../config/config');

const router = express.Router();

router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

router.get('/github', authController.github);
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/', failWithError: true, failureMessage: true }),
  authController.githubCallback
);

router.get('/discord', authenticate, authorize('discord'), authController.discord);
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), authController.discordCallback);

router.post('/send-otp', validate(authValidation.sendOtp), authController.sendOtp);
router.post('/verify-otp', validate(authValidation.verifyOtp), authController.verifyOtp);

module.exports = router;
