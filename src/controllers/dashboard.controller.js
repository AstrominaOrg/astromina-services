const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const organizationService = require('../services/organization.service');
const { userService } = require('../services');
const { getIssueByOwnerAndRepoAndIssueNumber, updateIssue } = require('../services/issue.service');

const leaderboardUser = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.sortBy = options.sortBy || 'totalRewardedBounty:desc';
  const users = await userService.queryUsers({}, options);

  res.send(users);
});

const leaderboardOrganization = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.sortBy = options.sortBy || 'totalRewardedBounty:desc';
  const organizations = await organizationService.queryOrganizations({}, options);

  res.send(organizations);
});

const setIssueRewarded = catchAsync(async (req, res) => {
  const { organization, repository, issue, rewarded } = req.query;

  getIssueByOwnerAndRepoAndIssueNumber(organization, repository, issue).then((issueDB) => {
    updateIssue(issueDB.issueId, { rewarded });
  });

  res.send({ message: 'Issue updated' });
});

module.exports = {
  leaderboardOrganization,
  setIssueRewarded,
  leaderboardUser,
};
