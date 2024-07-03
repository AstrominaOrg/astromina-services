const express = require('express');
const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(validate(userValidation.getUsers), userController.getUsers);

// Auth routes
router.route('/me').get(auth('getProfile'), userController.getMe);
router.route('/my-projects').get(auth('getProfile'), userController.getMyProjects);
router.route('/my-managed-issues').get(auth('getProfile'), userController.getMyManagedIssues);
router
  .route('/update-profile')
  .patch(auth('updateProfile'), validate(userValidation.updateProfile), userController.updateProfile);

// Public routes
router.route('/:username').get(validate(userValidation.getUser), userController.getUser);
router.route('/:username/github').get(validate(userValidation.getUser), cache, userController.getUserGithubActivity);
router.route('/:username/activity').get(validate(userValidation.getUser), userController.getUserActivity);
router
  .route('/:username/contributed-projects')
  .get(validate(userValidation.getContributedProjects), userController.getContributedProjects);

module.exports = router;
