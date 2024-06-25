const config = require('../config/config');
const logger = require('../config/logger');
const { createOrUpdateIssue, getIssueByIssueNumberAndRepositoryId } = require('./issue.service');
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

const getIssuesAndCommentsQuery = `
query ($org: String!, $repo: String!, $issuesFirst: Int!, $commentsFirst: Int!) {
  repository(owner: $org, name: $repo) {
    issues(first: $issuesFirst, states: [OPEN, CLOSED]) {
      nodes {
        id
        number
        title
        body
        state
        labels(first: 10) {
          nodes {
            name
          }
        }
        comments(first: $commentsFirst) {
          nodes {
            body
            id
          }
        }
        assignees(first: 10) {
          nodes {
            login
            id
          }
        }
        author {
          login
        }
      }
    }
  }
}`;

const pullRequestsQuery = `
query ($org: String!, $repo: String!) {
  repository(owner: $org, name: $repo) {
    pullRequests(first: 100, states: [OPEN, MERGED, CLOSED]) {
      nodes {
        id
        number
        title
        body
        merged
        additions
        deletions
        commits {
          totalCount
        }
        changedFiles
        comments {
          totalCount
        }
        reviewThreads(first: 5) {
          totalCount
        }
        maintainerCanModify
        mergeable
        authorAssociation
        isDraft
        assignees(first: 5) {
          nodes {
            login
            id
          }
        }
        reviewRequests(first: 10) {
          nodes {
            requestedReviewer {
              ... on User {
                login
              }
            }
          }
        }
        author {
          login
        }
        state
        labels(first: 5) {
          nodes {
            name
          }
        }
        closingIssuesReferences(first: 5) {
          nodes {
            number
            title
            state
          }
        }
      }
    }
  }
}`;

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

const getRepositoryPullRequests = async (org, repo) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const {
      repository: { pullRequests },
    } = await octokitInstance.graphql(pullRequestsQuery, { org, repo });
    return pullRequests.nodes.map((pr) => ({
      ...pr,
      labels: pr.labels.nodes.map((label) => label.name),
      comments: pr.comments.totalCount,
      reviewCommentsCount: pr.reviewThreads.totalCount, // Updated to use reviewThreads
      linked_issues: pr.closingIssuesReferences.nodes.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
      })),
      assignees: pr.assignees.nodes.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
      })),
      requested_reviewers: pr.reviewRequests.nodes.map((request) => request.requestedReviewer.login),
      review_requests: pr.reviewRequests.nodes.map((request) => request.requestedReviewer.login),
      commits: pr.commits.totalCount,
      review_comments: pr.reviewThreads.totalCount,
      draft: pr.isDraft,
      changed_files: pr.changedFiles,
      author_association: pr.authorAssociation,
      user: {
        login: pr.author.login,
        id: pr.author.id,
      },
      state: pr.state === 'MERGED' ? 'closed' : pr.state,
      merged: pr.merged,
      mergeable: pr.mergeable === 'CLEAN' || pr.mergeable === 'MERGEABLE',
      node_id: pr.id,
    }));
  } catch (error) {
    logger.error('Error fetching PR details:', error);
    throw error;
  }
};

const getRepositoryIssues = async (org, repo) => {
  try {
    const issuesData = await octokitInstance.graphql(getIssuesAndCommentsQuery, {
      org: org,
      repo: repo.name,
      issuesFirst: 100,
      commentsFirst: 10
    });

    const issues = issuesData.repository.issues.nodes;
    issues.forEach(issue => {
      price = 0;
      issue.comments.nodes.forEach(comment => {
        if (comment.body.includes('/price')) {
          price = comment.body.split('/price')[1].trim();
        }
      });
      createOrUpdateIssue({
        issueId: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.body,
        assignees: issue.assignees.nodes.map(assignee => ({
          login: assignee.login,
          id: assignee.id
        })),
        repositoryId: repo.node_id,
        creator: issue.author.login,
        labels: issue.labels.nodes.map(label => label.name),
        state: issue.state.toLowerCase(),
        price: price,
      })
    });
  } catch (error) {
    logger.error('Error fetching issues and comments:', error);
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



/** Recover the issues, pull requests of a organization
 * @param {string} org - The name of the organization.
 * @returns {Promise<Void>}
 */
const recoverOrganization = async (name) => {
  const repos = await getOrganizationRepos(name);
  repos.forEach(async (repo) => {
    await getRepositoryIssues(name, repo);

    await getRepositoryPullRequests(name, repo.name).then((prs) => {
      prs.forEach((pullRequest) => {
        if (pullRequest.merged) {
          pullRequest.linked_issues.forEach(async (issue) => {
            const issueDB = await getIssueByIssueNumberAndRepositoryId(issue.number, repo.node_id);
            if (issueDB) {
              await createOrUpdateIssue({
                issueId: issueDB.issueId,
                solved: true,
              });
            }
          });
        }

        createOrUpdatePullRequest({
          pullRequestId: pullRequest.node_id,
          number: pullRequest.number,
          title: pullRequest.title,
          body: pullRequest.body,
          repositoryId: repo.node_id,
          assignees: pullRequest.assignees.map((assignee) => assignee.login),
          requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => reviewer.login),
          linkedIssues: pullRequest.linked_issues.map((issue) => issue.number),
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
      });
    });

    await createOrUpdateRepository({
      repositoryId: repo.node_id,
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
// getRepositoryPullRequests('AstrominaOrg', 'abc')
//   .then((prs) => {
//     console.log(prs);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
recoverOrganization('AstrominaOrg');

module.exports = {
  getLinkedIssues,
  getOrganizationMembers,
};
