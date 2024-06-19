const { getOrganizationMembers } = require('../github.service');
const { updateOrganizationMembers } = require('../organization.service');

async function handleMemberChange(context) {
  const { organization } = context.payload;

  const members = await getOrganizationMembers(organization.login);

  await updateOrganizationMembers(organization.id, members);
}

module.exports = {
  handleMemberChange,
};
