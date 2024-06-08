const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignee: {
      type: String,
    },
    creator: {
      type: String,
    },
    state: {
      type: String,
      enum: ['open', 'closed'],
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.plugin(toJSON);

/**
 * @typedef Issue
 */
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
