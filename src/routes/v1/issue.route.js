const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const issueValidation = require('../../validations/issue.validation');
const issueController = require('../../controllers/issue.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router
  .route('/')
  .get(validate(issueValidation.getIssues), cache, issueController.getIssues)
  .post(auth('manageIssues'), validate(issueValidation.createIssue), issueController.createIssue);

router
  .route('/:issueId')
  .get(validate(issueValidation.getIssue), issueController.getIssue)
  .patch(auth('manageIssues'), validate(issueValidation.updateIssue), issueController.updateIssue)
  .delete(auth('manageIssues'), validate(issueValidation.deleteIssue), issueController.deleteIssue);

module.exports = router;
