const mongoose = require('mongoose');
const config = require('./config/config');
const { overrideAssignee, overrideManager, overrideThread } = require('./services/github.service');
const logger = require('./config/logger');
const { deleteOrganizationByName } = require('./services/organization.service');
const { deleteRepositoryByName } = require('./services/repository.service');
const { deleteIssuesByRepoName, updateIssue, getIssueByOwnerAndRepoAndIssueNumber } = require('./services/issue.service');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  if (process.argv[2] === '--override-assignee') {
    const username = process.argv[3];
    overrideAssignee(username);
  } else if (process.argv[2] === '--override-manager') {
    const username = process.argv[3];
    overrideManager(username);
  } else if (process.argv[2] === '--override-thread') {
    const threadId = process.argv[3];
    const threadName = process.argv[4];
    const threadMember = process.argv[5];
    overrideThread(threadId, threadName, threadMember);
  } else if (process.argv[2] === '--delete-org') {
    const organizationName = process.argv[3];
    deleteOrganizationByName(organizationName);
  } else if (process.argv[2] === '--delete-repo') {
    const organizationName = process.argv[3];
    const repoName = process.argv[4];
    deleteRepositoryByName(organizationName, repoName);
    deleteIssuesByRepoName(organizationName, repoName);
  } else if (process.argv[2] === '--set-issue-rewarded') {
    const organizationName = process.argv[3];
    const repoName = process.argv[4];
    const issueNumber = process.argv[5];
    const rewarded = process.argv[6] === 'true';
    getIssueByOwnerAndRepoAndIssueNumber(organizationName, repoName, issueNumber).then((issue) => {
      updateIssue(issue.issueId, { rewarded });
    });
  } else {
    logger.error('Invalid argument. Use --override-assignee or --override-manager or --override-thread');
  }
});
