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
      default: '',
    },
    private: {
      type: Boolean,
      default: false,
      required: true,
    },
    avatar_url: {
      type: String,
    },
    state: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'deleted'],
      required: true,
      default: 'pending',
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
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
