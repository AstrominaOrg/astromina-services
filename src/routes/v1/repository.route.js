const express = require('express');
const validate = require('../../middlewares/validate');
const repositoryValidation = require('../../validations/repository.validation');
const repositoryController = require('../../controllers/repository.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(authenticate, validate(repositoryValidation.getRepositories), repositoryController.getRepositories);

router
  .route('/:owner/:repo')
  .get(authenticate, validate(repositoryValidation.getRepository), repositoryController.getRepository);

module.exports = router;
