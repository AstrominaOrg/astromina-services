const { createOrUpdateRepository, updateRepositoryByRepoId } = require('../repository.service');
const { wrapHandlerWithCheck } = require('./helper');
const { getRepository } = require('../github.service');

async function handleRepositoryAdd(context) {
  const { repository, installation } = context.payload;

  const owner = repository.full_name.split('/')[0];
  const githubRepo = (await getRepository(owner, repository.name)).repository;

  await createOrUpdateRepository({
    repositoryId: githubRepo.id,
    name: githubRepo.name,
    url: githubRepo.url,
    full_name: githubRepo.nameWithOwner,
    owner: {
      login: githubRepo.owner.login,
      avatar_url: githubRepo.owner.avatarUrl,
    },
    type: installation.account.type,
    private: githubRepo.isPrivate,
    state: 'pending',
  });
}

async function handleRepositoryRemove(context) {
  const { repository } = context.payload;

  await createOrUpdateRepository({
    repositoryId: repository.node_id,
    state: 'deleted',
  });
}

const handleStar = async (context) => {
  const { repository } = context.payload;

  await updateRepositoryByRepoId(repository.node_id, {
    stars: repository.stargazers_count,
  });
};

module.exports = {
  handleStar: wrapHandlerWithCheck(handleStar),
  handleRepositoryAdd,
  handleRepositoryRemove,
};
