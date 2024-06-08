const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const repositorySchema = new mongoose.Schema(
  {
    repositoryId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Organization', 'User'],
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
    },
  },
  {
    timestamps: true,
  }
);

repositorySchema.plugin(toJSON);

/**
 * @typedef Repository
 */
const Repository = mongoose.model('Repository', repositorySchema);

module.exports = Repository;
