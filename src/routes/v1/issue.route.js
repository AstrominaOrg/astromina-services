const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const issueValidation = require('../../validations/issue.validation');
const issueController = require('../../controllers/issue.controller');
// const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(authenticate, validate(issueValidation.getIssues), issueController.getIssues);

router.route('/:owner/:repo/:issueNumber').get(authenticate, validate(issueValidation.getIssue), issueController.getIssue);

module.exports = router;
