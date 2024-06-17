const config = require('../config/config');
const logger = require('../config/logger');

const linkedIssuesQuery = `
query getLinkedIssues(
  $repository: String!,
  $owner: String!,
  $prNumber: Int!,
  $maxIssues: Int!,
) {
  repository(owner: $owner, name: $repository) {
    pullRequest(number: $prNumber) {
      closingIssuesReferences(first: $maxIssues) {
        nodes {
          number
          body
          title
        }
      }
    }
  }
}
`;

let octokitInstance;

/**
 * Initializes the Octokit instance.
 */
const initializeOctokit = async () => {
  const { App } = await import('octokit');

  const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  });

  const installationId = config.github.appInstallationId;
  octokitInstance = await app.getInstallationOctokit(installationId);
};

/**
 * Fetches linked issues data for a given pull request.
 *
 * @param {string} repository - The name of the repository.
 * @param {string} owner - The owner of the repository.
 * @param {number} prNumber - The pull request number.
 * @param {number} maxIssues - The maximum number of issues to fetch.
 * @returns {Promise<Object>} The linked issues data.
 */
const getLinkedIssues = async (repository, owner, prNumber, maxIssues) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const issueData = await octokitInstance.graphql({
      query: linkedIssuesQuery,
      repository,
      owner,
      prNumber,
      maxIssues,
    });

    return issueData;
  } catch (error) {
    logger.error('Error fetching linked issues:', error);
    throw error;
  }
};

/**
 * Fetches members of a GitHub organization.
 * @param {string} org - The name of the organization.
 * @returns {Promise<Object>} The members of the organization.
 */
const getOrganizationMembers = async (org) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const membersData = await octokitInstance.rest.orgs.listMembers({
      org,
    });

    const members = membersData.data.map((member) => member);

    const roles = await Promise.all(
      members.map(async (member) => {
        const role = await octokitInstance.rest.orgs.getMembershipForUser({
          org,
          username: member.login,
        });

        return {
          login: member.login,
          id: member.id,
          role: role.data.role,
        };
      })
    );

    return roles;
  } catch (error) {
    logger.error('Error fetching organization members:', error);
    throw error;
  }
};

module.exports = {
  getLinkedIssues,
  getOrganizationMembers,
};
