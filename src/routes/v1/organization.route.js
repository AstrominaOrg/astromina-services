const express = require('express');
// const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const organizationValidation = require('../../validations/organization.validation');
const organizationController = require('../../controllers/organization.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(validate(organizationValidation.getOrganizations), cache, organizationController.getOrganizations);

router
  .route('/:organizationId')
  .get(validate(organizationValidation.getOrganization), organizationController.getOrganization);

router
  .route('/:organizationId/top-contributors')
  .get(validate(organizationValidation.getTopContributors), organizationController.getTopContributors);

router
  .route('/:organizationId/bounty-totals')
  .get(validate(organizationValidation.getBountyTotals), organizationController.getBountyTotals);

module.exports = router;
