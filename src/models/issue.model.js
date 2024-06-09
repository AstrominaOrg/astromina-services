const mongoose = require('mongoose');
const Repository = require('./repository.model');
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
    assignees: {
      type: [String],
      default: [],
    },
    repository: Repository.schema,
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
    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.plugin(toJSON);
issueSchema.index({ issueId: 1 }, { unique: true });

/**
 * @typedef Issue
 */
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
