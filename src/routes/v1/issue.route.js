const express = require('express');
// const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const issueValidation = require('../../validations/issue.validation');
const issueController = require('../../controllers/issue.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(validate(issueValidation.getIssues), cache, issueController.getIssues);

router.route('/:owner/:repo/:issueNumber').get(validate(issueValidation.getIssue), cache, issueController.getIssue);

module.exports = router;
