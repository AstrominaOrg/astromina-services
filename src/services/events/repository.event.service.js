const { createOrUpdateRepository, updateRepositoryByRepoId } = require('../repository.service');
const { wrapHandlerWithCheck } = require('./helper');

async function handleRepositoryAdd(context) {
  const { repository, installation } = context.payload;

  await createOrUpdateRepository({
    repositoryId: repository.node_id,
    name: repository.name,
    url: repository.html_url,
    full_name: repository.full_name,
    owner: installation.account.login,
    type: installation.account.type,
    private: repository.private,
    state: 'pending',
  });
}

async function handleRepositoryRemove(context) {
  const { repository, installation } = context.payload;

  await createOrUpdateRepository({
    repositoryId: repository.node_id,
    name: repository.name,
    full_name: repository.full_name,
    owner: installation.account.login,
    type: installation.account.type,
    private: repository.private,
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
