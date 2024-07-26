const { getOrganization } = require('../organization.service');
const { getRepositoryByRepoId } = require('../repository.service');

async function checkOrganizationAndRepository(context) {
  if (context.payload.repository.owner.type !== 'Organization') {
    const repositoryId = context.payload.repository.node_id;
    const repository = await getRepositoryByRepoId(repositoryId);

    if (!repository || repository.state !== 'accepted') {
      return false;
    }

    return true;
  }
  const organizationId = context.payload.organization.node_id;

  const organization = await getOrganization(organizationId);

  if (!organization || organization.state !== 'accepted') {
    return false;
  }

  return true;
}

async function handleWithCheck(fn, context) {
  if (await checkOrganizationAndRepository(context)) {
    return fn(context);
  }
}

function wrapHandlerWithCheck(fn) {
  return async (context) => {
    await handleWithCheck(fn, context);
  };
}

module.exports = {
  checkOrganizationAndRepository,
  handleWithCheck,
  wrapHandlerWithCheck,
};
