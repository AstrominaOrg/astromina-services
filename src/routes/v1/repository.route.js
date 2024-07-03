const express = require('express');
// const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const repositoryValidation = require('../../validations/repository.validation');
const repositoryController = require('../../controllers/repository.controller');
const { cache } = require('../../middlewares/redis');

const router = express.Router();

router.route('/').get(validate(repositoryValidation.getRepositories), cache, repositoryController.getRepositories);

router.route('/:owner/:repo').get(validate(repositoryValidation.getRepository), repositoryController.getRepository);

module.exports = router;
