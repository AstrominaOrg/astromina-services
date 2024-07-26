const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { repositoryService } = require('../services');

const getRepositories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'full_name', 'owner', 'type', 'private', 'state']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (req.query.ownerLogin) {
    filter['owner.login'] = req.query.ownerLogin;
  }

  if (req.authUser) {
    filter.$or = [
      { private: false },
      {
        private: true,
        'collaborators.login': req.authUser.github.username,
      },
    ];
  } else {
    filter.private = false;
  }

  const result = await repositoryService.queryRepositories(filter, options);
  res.send(result);
});

const getRepository = catchAsync(async (req, res) => {
  const repository = await repositoryService.getRepositoryByOwnerAndName(req.params.owner, req.params.repo);
  if (!repository) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found');
  }

  if (repository.private) {
    if (!req.authUser) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const isCollaborator = repository.collaborators.some(
      (collaborator) => collaborator.login === req.authUser.github.username
    );

    if (!isCollaborator) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied. You are not a collaborator for this repository.');
    }
  }

  res.send(repository);
});

module.exports = {
  getRepositories,
  getRepository,
};
