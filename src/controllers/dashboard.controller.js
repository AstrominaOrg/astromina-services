const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const organizationService = require('../services/organization.service');
const { userService } = require('../services');

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

module.exports = {
  leaderboardOrganization,
  leaderboardUser,
};