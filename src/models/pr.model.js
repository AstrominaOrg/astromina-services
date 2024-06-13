const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const pullRequestScheme = new mongoose.Schema(
  {
    pullRequestId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
    },
    repositoryId: {
      type: Number,
      required: true,
    },
    assignees: {
      type: [String],
      default: [],
    },
    requestedReviewers: {
      type: [String],
      default: [],
    },
    linkedIssues: {
      type: [Number],
      default: [],
    },
    state: {
      type: String,
      enum: ['open', 'closed'],
      required: true,
    },
    labels: {
      type: [String],
      default: [],
    },
    creator: {
      type: String,
    },
    merged: {
      type: Boolean,
      default: false,
    },
    commits: {
      type: Number,
      default: 0,
    },
    additions: {
      type: Number,
      default: 0,
    },
    deletions: {
      type: Number,
      default: 0,
    },
    changedFiles: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    reviewComments: {
      type: Number,
      default: 0,
    },
    maintainerCanModify: {
      type: Boolean,
      default: false,
    },
    mergeable: {
      type: Boolean,
      default: false,
    },
    authorAssociation: {
      type: String,
      enum: ['COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN', 'MEMBER', 'NONE', 'OWNER'],
    },
    draft: {
      type: Boolean,
      default: false,
    },
    closedAt: {
      type: Date,
    },
    mergedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

pullRequestScheme.plugin(toJSON);
pullRequestScheme.index({ pullRequestId: 1 }, { unique: true });

/**
 * @typedef PullRequest
 */
const PullRequest = mongoose.model('PullRequest', pullRequestScheme);

module.exports = PullRequest;
