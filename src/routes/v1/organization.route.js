const express = require('express');
const { organizationMember, authorize, authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const organizationValidation = require('../../validations/organization.validation');
const organizationController = require('../../controllers/organization.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router
  .route('/')
  .get(authenticate, validate(organizationValidation.getOrganizations), cache, organizationController.getOrganizations);

router.route('/redirect').get(organizationController.redirect);

router
  .route('/:organizationName')
  .get(authenticate, validate(organizationValidation.getOrganization), organizationController.getOrganizationByName);

router
  .route('/:organizationName/top-contributors')
  .get(authenticate, validate(organizationValidation.getTopContributors), organizationController.getTopContributors);

router
  .route('/:organizationName/update-profile')
  .patch(
    authenticate,
    authorize('updateProfile'),
    organizationMember,
    validate(organizationValidation.updateProfile),
    organizationController.updateProfile
  );

module.exports = router;
