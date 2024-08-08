const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value) && value !== '') {
          throw new Error('Invalid email');
        }
      },
    },
    github: {
      id: {
        type: String,
        required: true,
        unique: true,
      },
      username: {
        type: String,
        required: true,
        unique: true,
      },
      emails: {
        type: [String],
        required: true,
      },
      photos: {
        type: [String],
        required: true,
      },
      company: {
        type: String,
        trim: true,
      },
      avatar_url: {
        type: String,
        required: true,
      },
    },
    discord: {
      id: {
        type: String,
      },
      username: {
        type: String,
      },
    },
    availableDays: {
      type: Number,
      default: -1,
    },
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
    telegram: {
      url: {
        type: String,
      },
    },
    linkedin: {
      url: {
        type: String,
      },
    },
    location: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if githubId is taken
 * @param {string} githubId - The user's GitHub ID
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isGithubIdTaken = async function (githubId, excludeUserId) {
  const user = await this.findOne({ githubId, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
