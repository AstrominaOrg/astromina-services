const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

// const subIssueSchema = new mongoose.Schema({
//   issueId: {
//     type: String,
//     required: true,
//   },
//   number: {
//     type: Number,
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true,
//   },
//   created_at: {
//     type: Date,
//     default: Date.now,
//   },
//   url: {
//     type: String,
//     required: true,
//   },
//   creator: {
//     type: String,
//     required: true,
//   },
//   price: {
//     type: Number,
//     default: 0,
//   },
//   thread: {
//     id: {
//       type: String,
//     },
//     name: {
//       type: String,
//     },
//     members: {
//       type: [String],
//     },
//   },
// });

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
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
      bio: {
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
        unique: true,
      },
    },
    availableDays: {
      type: Number,
      default: -1,
    },
    // issues: {
    //   assigned: [subIssueSchema],
    //   solved: [subIssueSchema],
    //   closed: [subIssueSchema],
    // },
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
