const config = require('../config/config');
const logger = require('../config/logger');
const { createOrUpdateIssue } = require('./issue.service');
const fs = require('fs');
const { createRepository, createOrUpdateRepository } = require('./repository.service');
const { createOrUpdatePullRequest } = require('./pr.service');

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

const getOrganizationRepos = async (org) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const reposData = await octokitInstance.rest.repos.listForOrg({
      org,
    });

    return reposData.data.map((repo) => repo);
  } catch (error) {
    logger.error('Error fetching organization repos:', error);
    throw error;
  }
};

const getRepositoryIssues = async (owner, repo) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const allIssueData = await octokitInstance.paginate(`GET /repos/${owner}/${repo}/issues`, {
      owner,
      repo,
      state: 'all',
    });

    return allIssueData.filter((issue) => !issue.pull_request);
  } catch (error) {
    logger.error('Error fetching repository issues:', error);
    throw error;
  }
};

const getRepositoryPullRequests = async (owner, repo) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const allPrData = await octokitInstance.paginate(`GET /repos/${owner}/${repo}/pulls`, {
      owner,
      repo,
      state: 'all',
    });

    return allPrData;
  } catch (error) {
    logger.error('Error fetching repository pull requests:', error);
    throw error;
  }
};

/** Recover the issues, pull requests of a organization
 * @param {string} org - The name of the organization.
 * @returns {Promise<Void>}
 */
const recoverOrganization = async (name) => {
  const repos = await getOrganizationRepos(name);
  repos.forEach((repo) => {
    getRepositoryIssues(name, repo.name).then((issues) => {
      issues.forEach((issue) => {
        createOrUpdateIssue({
          issueId: issue.id,
          number: issue.number,
          title: issue.title,
          description: issue.body,
          assignees: issue.assignees.map((assignee) => {
            return {
              login: assignee.login,
              id: assignee.id,
            };
          }),
          repositoryId: repo.id,
          creator: {
            login: issue.user.login,
            id: issue.user.id,
          },
          labels: issue.labels.map((label) => label.name),
          state: issue.state,
        });
      });
    });

    getRepositoryPullRequests(name, repo.name).then((prs) => {
      prs.forEach((pullRequest) => {
        getLinkedIssues(repo.name, repo.owner.login, pullRequest.number, 5).then((linkedIssues) => {
          createOrUpdatePullRequest({
            pullRequestId: pullRequest.id,
            number: pullRequest.number,
            title: pullRequest.title,
            body: pullRequest.body,
            repositoryId: repo.id,
            assignees: pullRequest.assignees.map((assignee) => assignee.login),
            requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => reviewer.login),
            linkedIssues: linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
            state: pullRequest.state,
            labels: pullRequest.labels.map((label) => label.name),
            creator: pullRequest.user.login,
            merged: pullRequest.merged,
            commits: pullRequest.commits,
            additions: pullRequest.additions,
            deletions: pullRequest.deletions,
            changedFiles: pullRequest.changed_files,
            comments: pullRequest.comments,
            reviewComments: pullRequest.review_comments,
            maintainerCanModify: pullRequest.maintainer_can_modify,
            mergeable: pullRequest.mergeable,
            authorAssociation: pullRequest.author_association,
            draft: pullRequest.draft,
          });
        })
      });
    });

    createOrUpdateRepository({
      repositoryId: repo.id,
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      full_name: repo.full_name,
      owner: repo.owner.login,
      type: repo.owner.type,
      private: repo.private,
      state: 'pending',
    });
  });
};

/**
 * Fetches the organization.
 * @param {string} org - The name of the organization.
 * @returns {Promise<Object>} The organization.
 */
const getOrganization = async (org) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const issuesData = await octokitInstance.rest.orgs.get({
      org,
    });

    return issuesData;
  } catch (error) {
    logger.error('Error fetching organization:', error);
    throw error;
  }
};

module.exports = {
  getLinkedIssues,
  getOrganizationMembers,
};
