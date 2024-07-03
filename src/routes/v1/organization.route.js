const express = require('express');
const { auth, organizationMember } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const organizationValidation = require('../../validations/organization.validation');
const organizationController = require('../../controllers/organization.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(validate(organizationValidation.getOrganizations), cache, organizationController.getOrganizations);

router
  .route('/:organizationName')
  .get(validate(organizationValidation.getOrganization), organizationController.getOrganizationByName);

router
  .route('/:organizationName/top-contributors')
  .get(validate(organizationValidation.getTopContributors), organizationController.getTopContributors);

router
  .route('/:organizationName/bounty-totals')
  .get(validate(organizationValidation.getBountyTotals), organizationController.getBountyTotals);

router
  .route('/:organizationName/update-profile')
  .patch(
    auth('updateProfile'),
    organizationMember,
    validate(organizationValidation.updateProfile),
    organizationController.updateProfile
  );
module.exports = router;
