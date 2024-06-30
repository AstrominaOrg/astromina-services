const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.route('/').get(validate(userValidation.getUsers), userController.getUsers);

router.route('/me').get(auth('getProfile'), userController.getMe);
router.route('/:username').get(validate(userValidation.getUser), userController.getUser);
router
  .route('/:username/contributed-projects')
  .get(validate(userValidation.getContributedProjects), userController.getContributedProjects);

module.exports = router;
