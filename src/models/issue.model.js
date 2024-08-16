const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { updateRepositoryStats, updateOrganizationStats, updateAssigneeStats } = require('../utils/mongo');
const { name } = require('faker/lib/locales/az');

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
          avatar_url: {
            type: String,
          },
          rewarded: {
            type: Boolean,
            default: false,
          },
          assigned_at: {
            type: Date,
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
      avatar_url: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
    },
    managers: {
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
    state: {
      type: String,
      enum: ['open', 'closed'],
      required: true,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    rewarded: {
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
    solved_at: {
      type: Date,
    },
    collaborators: [
      {
        login: {
          type: String,
          required: true,
        },
        avatar_url: {
          type: String,
          required: true,
        },
      },
    ],
    private: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.plugin(toJSON);
issueSchema.plugin(paginate);
issueSchema.index({ issueId: 1 }, { unique: true });

issueSchema.pre('save', async function (next) {
  try {
    const Repository = mongoose.model('Repository');
    const Organization = mongoose.model('Organization');
    const repo = await Repository.findOne({ repositoryId: this.repository.id });
    const org = await Organization.findOne({ title: this.owner.login });
    if (repo) {
      this.collaborators = repo.collaborators;
      this.private = repo.private;
    }
    if (org) {
      this.owner.name = org.name;
    }
  } catch (err) {
    return next(err);
  }
  next();
});

issueSchema.post('save', async function () {
  await updateRepositoryStats(this.repository.id);
  await updateOrganizationStats(this.owner.login);
  this.assignees.forEach(async (assignee) => {
    await updateAssigneeStats(assignee.login);
  });
});

issueSchema.post('remove', async function () {
  await updateRepositoryStats(this.repository.id);
  await updateOrganizationStats(this.owner.login);
  this.assignees.forEach(async (assignee) => {
    await updateAssigneeStats(assignee.login);
  });
});

issueSchema.post('updateOne', async function () {
  await updateRepositoryStats(this.repository.id);
  await updateOrganizationStats(this.owner.login);
  this.assignees.forEach(async (assignee) => {
    await updateAssigneeStats(assignee.login);
  });
});

issueSchema.post('deleteOne', async function () {
  await updateRepositoryStats(this.repository.id);
  await updateOrganizationStats(this.owner.login);
  this.assignees.forEach(async (assignee) => {
    await updateAssigneeStats(assignee.login);
  });
});

/**
 * @typedef Issue
 */
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
