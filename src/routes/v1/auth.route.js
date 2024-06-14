const express = require('express');
const passport = require('passport');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');

const router = express.Router();

router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  authController.githubCallback
);

router.get('/discord', auth('discord'), authController.discord, passport.authenticate('discord'));
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  authController.discordCallback
);

module.exports = router;
