const config = require('../config/config');
const logger = require('../config/logger');
const {
  getIssueByIssueNumberAndRepositoryId,
  markIssueAsSolved,
  updatePrice,
  queryIssues,
  updateIssue,
} = require('./issue.service');
const { createOrUpdateRepository, deleteRepositoriesByOwner } = require('./repository.service');
const { createOrUpdateOrganization } = require('./organization.service');
const { saveIssue } = require('../utils/issue.utils');
const { savePullRequest } = require('../utils/pr.utils');

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
        createdAt
        title
        body
        state
        labels(first: 10) {
          nodes {
            name
          }
        }
        timelineItems(itemTypes: [ASSIGNED_EVENT], first: 10) {
          nodes {
            ... on AssignedEvent {
              createdAt
              assignee {
                ... on User {
                  login,
                  url
                }
                ... on Bot {
                  login,
                  url            
                }
              }
            }
          }
        }
        comments(first: $commentsFirst, after: $commentsAfter) {
          nodes {
            author {
              login
              avatarUrl
            }
            body
            id
          }
        }
        assignees(first: 10) {
          nodes {
            login
            avatarUrl
            createdAt
            id
          }
        }
        author {
          login
          avatarUrl
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
        mergedAt
        mergeable
        authorAssociation
        isDraft
        assignees(first: 5) {
          nodes {
            login
            id
            avatarUrl
          }
        }
        reviewRequests(first: 5) {
          nodes {
            requestedReviewer {
              ... on User {
                login
                avatarUrl
              }
            }
          }
        }
        author {
          login
          avatarUrl
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

const organizationRepositoriesQueryWithoutCollab = `
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
          avatarUrl
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
          avatarUrl
        }
        collaborators {
          nodes {
            login
            avatarUrl
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

const getRepositoryQuery = `
query getRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    owner {
      login
      avatarUrl
    }
    url
    description
    stargazerCount
    forkCount
    nameWithOwner
    visibility
    isPrivate
    collaborators {
      nodes {
        login
        avatarUrl
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
const initializeOctokit = async (login) => {
  const { App } = await import('octokit');

  const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  });

  logger.info(`Initializing Octokit instance for ${login || 'the app'}`);

  const [installation] = [
    await app.octokit.request('GET /orgs/{org}/installation', { org: login }).catch((error) => null),
    await app.octokit.request('GET /users/{username}/installation', { username: login }).catch((error) => null),
  ].filter(Boolean);

  const installationId = installation?.data?.id || config.github.appInstallationId;

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
  await initializeOctokit(owner);

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
  }
};

const getRepositoryPullRequests = async (org, repo) => {
  await initializeOctokit(org);

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
          await markIssueAsSolved(issueDB.issueId);
        }
      });
    }

    if (pr.author === null) {
      pr.author = { login: 'ghost' };
    }

    pr.assignees = pr.assignees.nodes;
    pr.requested_reviewers = pr.reviewRequests.nodes.map((review) => review.requestedReviewer);
    pr.labels = pr.labels.nodes;
    pr.mergeable = pr.mergeable === 'CLEAN' || pr.mergeable === 'MERGEABLE';
    pr.state = pr.state === 'MERGED' ? 'closed' : pr.state.toLowerCase();
    pr.draft = pr.isDraft;
    pr.commits = pr.commits.totalCount;
    pr.comments = pr.comments.totalCount;
    pr.reviewComments = pr.reviewThreads.totalCount;

    savePullRequest(pr, repo, linked_issues);
  });
};

const getRepositoryIssues = async (org, repo) => {
  await initializeOctokit(org);

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
  }

  await Promise.all(
    allIssues.map(async (issue) => {
      issue.comments = issue.comments.nodes;
      issue.labels = issue.labels.nodes;

      issue.assignees = issue.assignees.nodes.map((assignee) => {
        const assigned_at = issue.timelineItems.nodes.find(
          (item) => item.assignee && item.assignee.login === assignee.login
        )?.createdAt;

        return {
          login: assignee.login,
          avatar_url: assignee.avatarUrl,
          assigned_at,
        };
      });

      issue.author = issue.author || { login: 'ghost', avatarUrl: '' };

      await saveIssue(issue, repo);

      // Check if there's a comment with the price command
      const priceComment = issue.comments.find((comment) => comment.body.includes('/price'));
      if (priceComment) {
        const price = priceComment.body.split('/price')[1].trim();
        const priceManager = priceComment.author || { login: 'ghost', avatarUrl: '' };

        await updatePrice(issue.id, price, priceManager);
      }
    })
  );
};

/**
 * Fetches members of a GitHub organization.
 * @param {string} org - The name of the organization.
 * @returns {Promise<Object>} The members of the organization.
 */
const getOrganizationMembers = async (org) => {
  await initializeOctokit(org);

  try {
    const allMembersData = await octokitInstance.rest.orgs.listMembers({
      org,
    });

    const allMembers = allMembersData.data;

    const publicMembersData = await octokitInstance.rest.orgs.listPublicMembers({
      org,
    });

    const publicMembers = publicMembersData.data;

    const publicMemberLogins = new Set(publicMembers.map((member) => member.login));

    const roles = await Promise.all(
      allMembers.map(async (member) => {
        let role = 'member';
        let visibility = publicMemberLogins.has(member.login) ? 'public' : 'private';
        try {
          const roleData = await octokitInstance.rest.orgs.getMembershipForUser({
            org,
            username: member.login,
          });

          role = roleData.data.role;
        } catch (error) {}

        return {
          login: member.login,
          avatar_url: member.avatar_url,
          role,
          visibility,
        };
      })
    );

    return roles;
  } catch (error) {
    logger.error('Error fetching organization members:', error);
  }
};

const getOrganizationRepos = async (org) => {
  await initializeOctokit(org);

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
    try {
      const reposData = await octokitInstance.graphql(organizationRepositoriesQueryWithoutCollab, {
        org,
        reposFirst: 100,
        reposAfter,
      });
  
      const repos = reposData.organization.repositories;
      allRepos = allRepos.concat(repos.nodes);
  
      reposAfter = repos.pageInfo.endCursor;
      hasNextPage = repos.pageInfo.hasNextPage;
    }
    catch (error) {
      logger.error('Error fetching organization repos:', error);
    }
  }

  return allRepos;
};

/** Recover the issues, pull requests of a organization
 * @param {string} org - The name of the organization.
 * @returns {Promise<Void>}
 */
const recoverOrganization = async (name) => {
  await initializeOctokit(name);

  const organization = await getOrganization(name);

  await createOrUpdateOrganization({
    organizationId: organization.data.node_id,
    title: organization.data.login,
    name: organization.data.name || organization.data.login,
    website: {
      url: organization.data.blog,
    },
    twitter: {
      url: `https://x.com/${organization.data.twitter_username}`,
    },
    url: organization.data.url,
    description: organization.data.description,
    avatar_url: organization.data.avatar_url,
    state: 'accepted',
    members: await getOrganizationMembers(name),
  });

  let repos = await getOrganizationRepos(name);

  await createOrUpdateOrganization({
    organizationId: organization.data.node_id,
    repositories: repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
    })),
  });
  
  await deleteRepositoriesByOwner(name);

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
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
        avatar_url: repo.owner.avatarUrl,
      },
      collaborators: repo.collaborators?.nodes.map((collaborator) => ({
        login: collaborator.login,
        avatar_url: collaborator.avatarUrl,
      })),
      type: 'Organization',
      private: repo.visibility === 'PRIVATE',
      state: 'accepted',
    });

    await getRepositoryIssues(name, repo);
    await getRepositoryPullRequests(name, repo);

    logger.info(`Repository recovered: ${repo.name}`);
  }
};

/**
 * Fetches the organization.
 * @param {string} org - The name of the organization.
 * @returns {Promise<Object>} The organization.
 */
const getOrganization = async (org) => {
  await initializeOctokit(org);

  try {
    const issuesData = await octokitInstance.rest.orgs.get({
      org,
    });

    return issuesData;
  } catch (error) {
    logger.error('Error fetching organization:', error);
  }
};

/**
 * Fetches the contributions of a user.
 * @param {string} userName - The name of the user.
 * @returns {Promise<Object>} The contributions of the user.
 */
const getUserContributions = async (userName) => {
  await initializeOctokit();

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
  }
};

const overrideAssignee = async (username) => {
  await initializeOctokit();

  const githubUser = await octokitInstance.rest.users.getByUsername({
    username,
  });

  const issues = (await queryIssues({}, { limit: 100 })).results;

  for (let i = 0; i < issues.length; i++) {
    const isRewarded = Math.random() >= 0.5;
    const issue = issues[i];
    await updateIssue(issue.issueId, {
      assignees: [
        {
          login: githubUser.data.login,
          avatar_url: githubUser.data.avatar_url,
          id: githubUser.data.id,
          rewarded: isRewarded,
        },
      ],
      solved: isRewarded,
      rewarded: isRewarded,
    });
  }
};

const sendCommend = async (context, message) => {
  await context.octokit.issues.createComment({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    issue_number: context.payload.issue.number,
    body: message,
  });
}

const sendCommendToIssue = async (owner, repo, issue_number, message) => {
  await initializeOctokit(owner);

  await octokitInstance.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body: message,
  });
}

const overrideManager = async (username) => {
  await initializeOctokit();

  const githubUser = await octokitInstance.rest.users.getByUsername({
    username,
  });

  const issues = (await queryIssues({}, { limit: 100 })).results;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    await updateIssue(issue.issueId, {
      managers: [
        {
          login: githubUser.data.login,
          avatar_url: githubUser.data.avatar_url,
        },
      ],
    });
  }
};

const overrideThread = async (threadId, threadName, threadMember) => {
  await initializeOctokit();

  const issues = (await queryIssues({}, { limit: 100 })).results;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    await updateIssue(issue.issueId, {
      thread: {
        id: threadId,
        name: threadName,
        members: [threadMember],
      },
    });
  }
};

const getRepository = async (owner, name) => {
  await initializeOctokit(owner);

  try {
    const repository = await octokitInstance.graphql(getRepositoryQuery, {
      owner,
      name,
    });

    return repository;
  } catch (error) {
    logger.error('Error fetching repository:', error);
  }
};
const getInstallation = async (installation_id) => {
  const { App } = await import('octokit');

  const app = new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  });

  const octokit = await app.getInstallationOctokit(installation_id);

  try {
    const { data: installationDetails } = await octokit.rest.apps.getInstallation({
      installation_id,
    });

    if (installationDetails.account.type === 'Organization') {
      const { data: organizationDetails } = await octokit.rest.orgs.get({
        org: installationDetails.account.login,
      });

      return organizationDetails;
    } else {
      return installationDetails;
    }
  } catch (error) {
    logger.error('Error fetching installation:', error);
  }
};

module.exports = {
  getLinkedIssues,
  getRepository,
  sendCommend,
  sendCommendToIssue,
  getInstallation,
  overrideManager,
  overrideAssignee,
  overrideThread,
  recoverOrganization,
  getOrganizationMembers,
  getUserContributions,
};
