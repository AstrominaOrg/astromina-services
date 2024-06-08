const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const organizationSchema = new mongoose.Schema(
  {
    organizationId: {
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
    avatar_url: {
      type: String,
    },
    state: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.plugin(toJSON);

/**
 * @typedef Issue
 */
const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
