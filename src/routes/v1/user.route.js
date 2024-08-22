const express = require('express');
const { authenticate, authorize, authenticateApiKey } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(authenticateApiKey, validate(userValidation.getUsers), userController.getUsers);

// Auth routes
router.route('/me').get(authenticate, authorize('getProfile'), userController.getMe);
router.route('/my-projects').get(authenticate, authorize('getProfile'), userController.getMyProjects);
router
  .route('/my-managed-issues')
  .get(
    validate(userValidation.getMyManagedIssues),
    authenticate,
    authorize('getProfile'),
    userController.getMyManagedIssues
  );
router
  .route('/my-assigned-issues')
  .get(
    validate(userValidation.getMyAssignedIssues),
    authenticate,
    authorize('getProfile'),
    userController.getMyAssignedIssues
  );
router
  .route('/update-profile')
  .patch(authenticate, authorize('updateProfile'), validate(userValidation.updateProfile), userController.updateProfile);

// Public routes
router.route('/:username').get(validate(userValidation.getUser), userController.getUser);
router.route('/:username/github').get(validate(userValidation.getUser), cache, userController.getUserGithubActivity);
router.route('/:username/activity').get(authenticate, validate(userValidation.getUser), userController.getUserActivity);
router
  .route('/:username/contributed-projects')
  .get(authenticate, validate(userValidation.getContributedProjects), userController.getContributedProjects);
router.route('/:username/is-discord-member').get(validate(userValidation.getUser), userController.isDiscordMember);

module.exports = router;
