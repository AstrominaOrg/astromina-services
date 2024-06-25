const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const repositoryValidation = require('../../validations/repository.validation');
const repositoryController = require('../../controllers/repository.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router
  .route('/')
  .get(validate(repositoryValidation.getRepositories), cache, repositoryController.getRepositories)
  .post(auth('manageRepositories'), validate(repositoryValidation.createRepository), repositoryController.createRepository);

router
  .route('/:repositoryId')
  .get(validate(repositoryValidation.getRepository), repositoryController.getRepository)
  .patch(auth('manageRepositories'), validate(repositoryValidation.updateRepository), repositoryController.updateRepository)
  .delete(
    auth('manageRepositories'),
    validate(repositoryValidation.deleteRepository),
    repositoryController.deleteRepository
  );

module.exports = router;
