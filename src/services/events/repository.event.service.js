const { createOrUpdateRepository, updateRepositoryByRepoId, getRepositoryByRepoId } = require('../repository.service');
const { wrapHandlerWithCheck } = require('./helper');
const { getRepository } = require('../github.service');
const { updateRepositoryIssuesVisibility, deleteRepositoryIssues } = require('../issue.service');

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
    collaborators: githubRepo.collaborators.nodes.map((collaborator) => ({
      login: collaborator.login,
      avatar_url: collaborator.avatarUrl,
    })),
    type: installation.account.type,
    private: githubRepo.isPrivate,
    state: 'pending',
  });
}

async function handleVisibilityChange(context) {
  const { repository } = context.payload;

  await updateRepositoryByRepoId(repository.node_id, {
    private: repository.private,
  });

  await updateRepositoryIssuesVisibility(repository.node_id, repository.private);
}

async function handleRepositoryRemove(context) {
  const { repository } = context.payload;

  await createOrUpdateRepository({
    repositoryId: repository.node_id,
    state: 'deleted',
  });

  await deleteRepositoryIssues(repository.node_id);
}

async function handleStar(context) {
  const { repository } = context.payload;

  await updateRepositoryByRepoId(repository.node_id, {
    stars: repository.stargazers_count,
  });
}

async function handleMemberAdded(context) {
  const { repository, member } = context.payload;

  const repoDB = await getRepositoryByRepoId(repository.node_id);

  if (!repoDB) {
    return;
  }

  const newCollaborators = [
    ...repoDB.collaborators,
    {
      login: member.login,
      avatar_url: member.avatar_url,
    },
  ];

  await updateRepositoryByRepoId(repository.node_id, {
    collaborators: newCollaborators,
  });
}

async function handleMemberRemoved(context) {
  const { repository, member } = context.payload;

  const repoDB = await getRepositoryByRepoId(repository.node_id);

  if (!repoDB) {
    return;
  }

  const newCollaborators = repoDB.collaborators.filter((collaborator) => collaborator.login !== member.login);

  await updateRepositoryByRepoId(repository.node_id, {
    collaborators: newCollaborators,
  });
}

module.exports = {
  handleStar: wrapHandlerWithCheck(handleStar),
  handleMemberRemoved: wrapHandlerWithCheck(handleMemberRemoved),
  handleMemberAdded: wrapHandlerWithCheck(handleMemberAdded),
  handleVisibilityChange: wrapHandlerWithCheck(handleVisibilityChange),
  handleRepositoryAdd,
  handleRepositoryRemove,
};
