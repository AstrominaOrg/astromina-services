const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const issueSchema = new mongoose.Schema(
  {
    issueId: {
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
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignees: {
      type: [
        {
          login: {
            type: String,
          },
          id: {
            type: String,
          },
        },
      ],
      default: [],
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
    owner: {
      login: {
        type: String,
        required: true,
      },
    },
    creator: {
      login: {
        type: String,
        required: true,
      },
    },
    state: {
      type: String,
      enum: ['open', 'closed'],
      required: true,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
    labels: {
      type: [String],
      default: [],
    },
    thread: {
      id: {
        type: String,
      },
      name: {
        type: String,
      },
      members: {
        type: [String],
      },
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.plugin(toJSON);
issueSchema.plugin(paginate);
issueSchema.index({ issueId: 1 }, { unique: true });

/**
 * @typedef Issue
 */
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
