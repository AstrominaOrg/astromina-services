const { getOrganizationMembers } = require('../github.service');
const { updateOrganizationMembers } = require('../organization.service');
const { wrapHandlerWithCheck } = require('./helper');

async function handleMemberChange(context) {
  const { organization } = context.payload;

  const members = await getOrganizationMembers(organization.login);

  await updateOrganizationMembers(organization.login, members);
}

module.exports = {
  handleMemberChange: wrapHandlerWithCheck(handleMemberChange),
};
