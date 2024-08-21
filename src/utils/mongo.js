const mongoose = require('mongoose');
const Repository = require('../models/repository.model');
const User = require('../models/user.model');

const updateRepositoryStats = async (repositoryId) => {
  const Issue = mongoose.model('Issue');

  const result = await Issue.aggregate([
    { $match: { 'repository.id': repositoryId } },
    {
      $facet: {
        totalIssues: [{ $count: 'count' }],
        totalRewardedBounty: [
          { $match: { solved: true, price: { $gt: 0 } } },
          { $group: { _id: null, totalPrice: { $sum: '$price' } } },
        ],
        totalAvailableBounty: [
          { $match: { solved: false, price: { $gt: 0 } } },
          { $group: { _id: null, totalPrice: { $sum: '$price' } } },
        ],
      },
    },
  ]);

  const totalIssues = result[0].totalIssues[0] ? result[0].totalIssues[0].count : 0;
  const totalRewardedBounty = result[0].totalRewardedBounty[0] ? result[0].totalRewardedBounty[0].totalPrice : 0;
  const totalAvailableBounty = result[0].totalAvailableBounty[0] ? result[0].totalAvailableBounty[0].totalPrice : 0;

  await Repository.findOneAndUpdate(
    { repositoryId },
    {
      totalIssue: totalIssues,
      totalRewardedBounty,
      totalAvailableBounty,
    }
  );
};

const updateOrganizationStats = async (organizationLogin) => {
  const Issue = mongoose.model('Issue');
  const Organization = mongoose.model('Organization');

  const result = await Issue.aggregate([
    { $match: { 'owner.login': organizationLogin } },
    {
      $facet: {
        totalIssues: [{ $count: 'count' }],
        totalRewardedBounty: [
          { $match: { rewarded: true, price: { $gt: 0 } } },
          { $group: { _id: null, totalPrice: { $sum: '$price' } } },
        ],
        totalAvailableBounty: [
          { $match: { solved: false, assignees: { $size: 0 }, state: 'open', price: { $gt: 0 } } },
          { $group: { _id: null, totalPrice: { $sum: '$price' } } },
        ],
      },
    },
  ]);

  const totalIssues = result[0].totalIssues[0] ? result[0].totalIssues[0].count : 0;
  const totalRewardedBounty = result[0].totalRewardedBounty[0] ? result[0].totalRewardedBounty[0].totalPrice : 0;
  const totalAvailableBounty = result[0].totalAvailableBounty[0] ? result[0].totalAvailableBounty[0].totalPrice : 0;

  await Organization.findOneAndUpdate(
    { title: organizationLogin },
    {
      totalIssue: totalIssues,
      totalRewardedBounty,
      totalAvailableBounty,
    }
  );
};

const updateAssigneeStats = async (assigneeLogin) => {
  // TODO: you can do better
  const Issue = mongoose.model('Issue');

  const result = await Issue.aggregate([
    { $match: { 'assignees.login': assigneeLogin } },
    {
      $facet: {
        totalRewardedBounty: [
          { $match: { solved: true, price: { $gt: 0 } } },
          { $group: { _id: null, totalPrice: { $sum: '$price' } } },
        ],
      },
    },
  ]);

  const totalRewardedBounty = result[0].totalRewardedBounty[0] ? result[0].totalRewardedBounty[0].totalPrice : 0;

  await User.findOneAndUpdate(
    { 'github.username': assigneeLogin },
    {
      totalRewardedBounty,
    }
  );
};

module.exports = {
  updateRepositoryStats,
  updateOrganizationStats,
  updateAssigneeStats,
};
