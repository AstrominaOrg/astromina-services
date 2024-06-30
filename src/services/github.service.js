const config = require('../config/config');
const logger = require('../config/logger');
const { createOrUpdateIssue, getIssueByIssueNumberAndRepositoryId } = require('./issue.service');
const { createOrUpdateRepository } = require('./repository.service');
const { createOrUpdatePullRequest } = require('./pr.service');
const { createOrUpdateOrganization } = require('./organization.service');

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
query ($org: String!, $repo: String!, $issuesFirst: Int!, $commentsFirst: Int!, $issuesAfter: String, $commentsAfter: String) {
  repository(owner: $org, name: $repo) {
    issues(first: $issuesFirst, after: $issuesAfter, states: [OPEN, CLOSED]) {
      nodes {
        id
        number
        url
        title
        body
        state
        labels(first: 10) {
          nodes {
            name
          }
        }
        comments(first: $commentsFirst, after: $commentsAfter) {
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
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}
`;

const pullRequestsQuery = `
query ($org: String!, $repo: String!, $pullRequestsFirst: Int!, $pullRequestsAfter: String) {
  repository(owner: $org, name: $repo) {
    pullRequests(first: $pullRequestsFirst, after: $pullRequestsAfter, states: [OPEN, MERGED, CLOSED]) {
      nodes {
        id
        number
        title
        body
        url
        merged
        commits {
          totalCount
        }
        comments {
          totalCount
        }
        reviewThreads {
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
        reviewRequests(first: 5) {
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
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`;

const organizationRepositoriesQuery = `
query ($org: String!, $reposFirst: Int!, $reposAfter: String) {
  organization(login: $org) {
    repositories(first: $reposFirst, after: $reposAfter) {
      nodes {
        id
        url
        name
        description
        stargazerCount
        forkCount
        nameWithOwner
        visibility
        owner {
          login
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`;

const userRepositoriesQuery = `
query ($user: String!, $reposFirst: Int!, $reposAfter: String) {
  user(login: $user) {
    repositories(first: $reposFirst, after: $reposAfter) {
      nodes {
        id
        name
        description
        stargazerCount
        forkCount
        nameWithOwner
        visibility
        owner {
          login
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`;

const userContributionsQuery = `
query($userName:String!) { 
  user(login: $userName){
    contributionsCollection {
      totalIssueContributions
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          firstDay
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
`;

let octokitInstance;

let requestCount = 0;
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

  octokitInstance.hook.before('request', async (options) => {
    requestCount++;
    options.headers['X-Github-Next-Global-ID'] = '1';
  });
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

  let allPullRequests = [];
  let pullRequestsAfter = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const pullRequestsData = await octokitInstance.graphql(pullRequestsQuery, {
        org,
        repo: repo.name,
        pullRequestsFirst: 100,
        pullRequestsAfter,
      });
      const pullRequests = pullRequestsData.repository.pullRequests;

      allPullRequests = allPullRequests.concat(pullRequests.nodes);

      pullRequestsAfter = pullRequests.pageInfo.endCursor;
      hasNextPage = pullRequests.pageInfo.hasNextPage;
    }
  } catch (error) {
    logger.error(`Error fetching PR details org: ${org}, repo: ${repo.name}:`, error);
    throw error;
  }

  allPullRequests.forEach(async (pr) => {
    if (pr.author === null) {
      pr.author = { login: 'ghost' };
    }

    const linked_issues = pr.closingIssuesReferences.nodes.map((issue) => issue.number);

    if (pr.merged) {
      linked_issues.forEach(async (issue) => {
        const issueDB = await getIssueByIssueNumberAndRepositoryId(issue, repo.id);
        if (issueDB) {
          await createOrUpdateIssue({
            issueId: issueDB.issueId,
            solved: true,
          });
        }
      });
    }

    if (pr.author === null) {
      pr.author = { login: 'ghost' };
    }

    await createOrUpdatePullRequest({
      pullRequestId: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      repository: {
        id: repo.id,
        name: repo.name,
      },
      assignees: pr.assignees.nodes.map((assignee) => {
        return {
          login: (assignee.login ? assignee.login : 'ghost'),
        }
      }),
      requestedReviewers: pr.reviewRequests.nodes.map((request) => {
        return {
          login: request.requestedReviewer?.login ? request.requestedReviewer.login : 'ghost',
        };
      }),
      linkedIssues: pr.closingIssuesReferences.nodes.map((issue) => issue.number),
      state: pr.state === 'MERGED' ? 'closed' : pr.state.toLowerCase(),
      labels: pr.labels.nodes.map((label) => label.name),
      creator: {
        login: pr.author.login,
      },
      merged: pr.merged,
      url: pr.url,
      commits: pr.commits.totalCount,
      comments: pr.comments.totalCount,
      reviewComments: pr.reviewThreads.totalCount,
      maintainerCanModify: pr.maintainerCanModify,
      mergeable: pr.mergeable === 'CLEAN' || pr.mergeable === 'MERGEABLE',
      authorAssociation: pr.authorAssociation,
      draft: pr.isDraft,
    });
  });
};

const getRepositoryIssues = async (org, repo) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  let allIssues = [];
  let issuesAfter = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const issuesData = await octokitInstance.graphql(getIssuesAndCommentsQuery, {
        org: org,
        repo: repo.name,
        issuesFirst: 100,
        commentsFirst: 10,
        issuesAfter: issuesAfter,
      });

      const issues = issuesData.repository.issues.nodes;
      allIssues = allIssues.concat(issues);

      issuesAfter = issuesData.repository.issues.pageInfo.endCursor;
      hasNextPage = issuesData.repository.issues.pageInfo.hasNextPage;
    }
  } catch (error) {
    logger.error('Error fetching issues and comments:', error);
    throw error;
  }

  allIssues.forEach((issue) => {
    price = 0;
    issue.comments.nodes.forEach((comment) => {
      if (comment.body.includes('/price')) {
        price = comment.body.split('/price')[1].trim();
      }
    });

    if (issue.author === null) {
      issue.author = { login: 'ghost' };
    }

    createOrUpdateIssue({
      issueId: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body,
      assignees: issue.assignees.nodes.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
      })),
      url: issue.url,
      repository: {
        id: repo.id,
        name: repo.name,
      },
      owner: {
        login: repo.owner.login,
      },
      creator: {
        login: issue.author.login,
      },
      labels: issue.labels.nodes.map((label) => label.name),
      state: issue.state.toLowerCase(),
      price: price,
    });
  });
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
        let role = 'member';
        try {
          const roleData = await octokitInstance.rest.orgs.getMembershipForUser({
            org,
            username: member.login,
          });

          role = roleData.data.role;
        } catch (error) {}

        return {
          login: member.login,
          id: member.id,
          role,
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

  let allRepos = [];
  let reposAfter = null;
  let hasNextPage = true;

  try {
    const reposData = await octokitInstance.graphql(organizationRepositoriesQuery, {
      org,
      reposFirst: 100,
      reposAfter,
    });

    const repos = reposData.organization.repositories;
    allRepos = allRepos.concat(repos.nodes);

    reposAfter = repos.pageInfo.endCursor;
    hasNextPage = repos.pageInfo.hasNextPage;
  } catch (error) {
    logger.error('Error fetching organization repos:', error);
    throw error;
  }

  return allRepos;
};

/** Recover the issues, pull requests of a organization
 * @param {string} org - The name of the organization.
 * @returns {Promise<Void>}
 */
const recoverOrganization = async (name) => {
  const organization = await getOrganization(name);
  createOrUpdateOrganization({
    organizationId: organization.data.node_id,
    title: organization.data.login,
    url: organization.data.url,
    description: organization.data.description,
    avatar_url: organization.data.avatar_url,
    state: 'accepted',
    members: await getOrganizationMembers(name),
  });

  let repos = await getOrganizationRepos(name);

  createOrUpdateOrganization({
    organizationId: organization.data.node_id,
    repositories: repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
    })),
  });

  repos.forEach(async (repo) => {
    await createOrUpdateRepository({
      repositoryId: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      full_name: repo.nameWithOwner,
      owner: {
        login: repo.owner.login,
      },
      type: 'Organization',
      private: repo.visibility === 'PRIVATE',
      state: 'pending',
    });

    await getRepositoryIssues(name, repo);

    await getRepositoryPullRequests(name, repo);

    logger.info(`Repository recovered: ${repo.name}`);
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

/**
 * Fetches the contributions of a user.
 * @param {string} userName - The name of the user.
 * @returns {Promise<Object>} The contributions of the user.
 */
const getUserContributions = async (userName) => {
  if (!octokitInstance) {
    await initializeOctokit();
  }

  try {
    const contributionsData = await octokitInstance.graphql(userContributionsQuery, {
      userName,
    });

    const contributions = contributionsData.user.contributionsCollection;
    const weekContributions = contributions.contributionCalendar.weeks;
    contributions.contributionCalendar.weeks = weekContributions.map((week) => {
      week.totalContributions = week.contributionDays.reduce((acc, day) => acc + day.contributionCount, 0);
      delete week.contributionDays;
      return week;
    });

    contributions.totalContributions = contributions.contributionCalendar.totalContributions;
    contributions.weeks = contributions.contributionCalendar.weeks;
    delete contributions.contributionCalendar;

    return contributionsData.user.contributionsCollection;
  } catch (error) {
    logger.error('Error fetching user contributions:', error);
    throw error;
  }
};

recoverOrganization('AstrominaOrg')

module.exports = {
  getLinkedIssues,
  getOrganizationMembers,
};
