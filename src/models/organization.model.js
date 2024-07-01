const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const organizationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    avatar_url: {
      type: String,
    },
    state: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      required: true,
    },
    socials: {
      twitter: {
        url: {
          type: String,
        },
      },
      website: {
        url: {
          type: String,
        },
      },
      discord: {
        url: {
          type: String,
        },
      },
      telegram: {
        url: {
          type: String,
        },
      },
    },
    members: {
      type: [
        {
          login: {
            type: String,
            required: true,
          },
          id: {
            type: String,
            required: true,
          },
          role: {
            type: String,
          },
          canEdit: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
    repositories: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
          description: {
            type: String,
          },
        },
      ],
      default: [],
    },
    totalIssue: {
      type: Number,
      default: 0,
    },
    totalRewardedBounty: {
      type: Number,
      default: 0,
    },
    totalAvailableBounty: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.plugin(toJSON);
organizationSchema.plugin(paginate);

/**
 * @typedef Issue
 */
const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
