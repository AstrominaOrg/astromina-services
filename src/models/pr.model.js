const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const pullRequestScheme = new mongoose.Schema(
  {
    pullRequestId: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    repository: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    assignees: {
      type: [
        {
          login: {
            type: String,
          },
          avatar_url: {
            type: String,
          },
        },
      ],
      default: [],
    },
    requestedReviewers: {
      type: [
        {
          login: {
            type: String,
          },
          avatar_url: {
            type: String,
          },
        },
      ],
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
    managers: {
      type: [
        {
          login: {
            type: String,
            required: true,
          },
          avatar_url: {
            type: String,
          },
        },
      ],
    },
    merged: {
      type: Boolean,
      default: false,
    },
    commits: {
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
