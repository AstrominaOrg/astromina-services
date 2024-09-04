const express = require('express');
const validate = require('../../middlewares/validate');
const { authenticateApiKey } = require('../../middlewares/auth');
const dashboardValidation = require('../../validations/dashboard.validation');
const dashboardController = require('../../controllers/dashboard.controller');

const router = express.Router();

router.get(
  '/leaderboardUser',
  authenticateApiKey,
  validate(dashboardValidation.leaderboard),
  dashboardController.leaderboardUser
);

router.get(
  '/leaderboardOrganization',
  authenticateApiKey,
  validate(dashboardValidation.leaderboard),
  dashboardController.leaderboardOrganization
);

router.get(
  '/setIssueRewarded',
  authenticateApiKey,
  validate(dashboardValidation.setIssueRewarded),
  dashboardController.setIssueRewarded
);

module.exports = router;
