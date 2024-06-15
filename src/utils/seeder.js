const mongoose = require('mongoose');
const faker = require('faker');
const logger = require('../config/logger');
const config = require('../config/config');
const { Issue, Admin, PullRequest, User, Repository, Organization } = require('../models');

const generateUniqueIds = (num, min, max) => {
  const ids = new Set();
  while (ids.size < num) {
    ids.add(faker.datatype.number({ min, max }));
  }
  return Array.from(ids);
};

const generateUniqueEmails = (num) => {
  const emails = new Set();
  while (emails.size < num) {
    emails.add(faker.internet.email());
  }
  return Array.from(emails);
};

const generateUniqueUsernames = (num) => {
  const usernames = new Set();
  while (usernames.size < num) {
    usernames.add(faker.internet.userName());
  }
  return Array.from(usernames);
};

const generateIssues = async (num) => {
  const issues = [];
  const issueIds = generateUniqueIds(num, 1, 10000);
  for (let i = 0; i < num; i += 1) {
    issues.push({
      issueId: issueIds[i],
      number: faker.datatype.number({ min: 1, max: 10000 }),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      assignees: [faker.internet.email(), faker.internet.email()],
      repositoryId: faker.datatype.number({ min: 1, max: 100 }),
      creator: faker.internet.email(),
      state: faker.random.arrayElement(['open', 'closed']),
      price: faker.datatype.number({ min: 0, max: 1000 }),
      labels: [faker.lorem.word(), faker.lorem.word()],
    });
  }
  return issues;
};

const generateAdmins = async (num) => {
  const admins = [];
  const adminEmails = generateUniqueEmails(num);
  const adminUsernames = generateUniqueUsernames(num);
  for (let i = 0; i < num; i += 1) {
    admins.push({
      username: adminUsernames[i],
      email: adminEmails[i],
    });
  }
  return admins;
};

const generatePullRequests = async (num) => {
  const prs = [];
  const prIds = generateUniqueIds(num, 1, 10000);
  for (let i = 0; i < num; i += 1) {
    prs.push({
      pullRequestId: prIds[i],
      number: faker.datatype.number({ min: 1, max: 10000 }),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraph(),
      repositoryId: faker.datatype.number({ min: 1, max: 100 }),
      assignees: [faker.internet.email(), faker.internet.email()],
      requestedReviewers: [faker.internet.email(), faker.internet.email()],
      linkedIssues: [faker.datatype.number({ min: 1, max: 100 })],
      state: faker.random.arrayElement(['open', 'closed']),
      labels: [faker.lorem.word(), faker.lorem.word()],
      creator: faker.internet.email(),
      merged: faker.datatype.boolean(),
      commits: faker.datatype.number({ min: 0, max: 100 }),
      additions: faker.datatype.number({ min: 0, max: 1000 }),
      deletions: faker.datatype.number({ min: 0, max: 1000 }),
      changedFiles: faker.datatype.number({ min: 0, max: 100 }),
      comments: faker.datatype.number({ min: 0, max: 100 }),
      reviewComments: faker.datatype.number({ min: 0, max: 100 }),
      maintainerCanModify: faker.datatype.boolean(),
      mergeable: faker.datatype.boolean(),
      authorAssociation: faker.random.arrayElement([
        'COLLABORATOR',
        'CONTRIBUTOR',
        'FIRST_TIMER',
        'FIRST_TIME_CONTRIBUTOR',
        'MANNEQUIN',
        'MEMBER',
        'NONE',
        'OWNER',
      ]),
      draft: faker.datatype.boolean(),
      closedAt: faker.date.past(),
      mergedAt: faker.date.past(),
    });
  }
  return prs;
};

const generateUsers = async (num) => {
  const users = [];
  const discordIds = generateUniqueIds(num, 1, 10000);
  const githubIds = generateUniqueIds(num, 1, 10000);
  const emails = generateUniqueEmails(num);
  const usernames = generateUniqueUsernames(num);
  for (let i = 0; i < num; i += 1) {
    users.push({
      name: faker.name.findName(),
      email: emails[i],
      github: {
        id: githubIds[i],
        username: usernames[i],
        emails: [faker.internet.email()],
        photos: [faker.image.avatar()],
        company: faker.company.companyName(),
        bio: faker.lorem.sentence(),
      },
      discord: {
        id: discordIds[i],
      },
    });
  }
  return users;
};

const generateRepositories = async (num) => {
  const repositories = [];
  const repoIds = generateUniqueIds(num, 1, 10000);
  for (let i = 0; i < num; i += 1) {
    repositories.push({
      repositoryId: repoIds[i],
      name: faker.lorem.word(),
      full_name: faker.lorem.words(2),
      owner: faker.internet.userName(),
      type: faker.random.arrayElement(['Organization', 'User']),
      description: faker.lorem.paragraph(),
      avatar_url: faker.image.avatar(),
      state: faker.random.arrayElement(['pending', 'accepted', 'rejected', 'deleted']),
    });
  }
  return repositories;
};

const generateOrganizations = async (num) => {
  const organizations = [];
  const orgIds = generateUniqueIds(num, 1, 10000);
  for (let i = 0; i < num; i += 1) {
    organizations.push({
      organizationId: orgIds[i],
      title: faker.company.companyName(),
      description: faker.lorem.paragraph(),
      avatar_url: faker.image.avatar(),
      state: faker.random.arrayElement(['pending', 'accepted', 'rejected']),
    });
  }
  return organizations;
};

const seedDatabase = async () => {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  logger.info('Connected to MongoDB');

  await Issue.deleteMany({});
  await Admin.deleteMany({});
  await PullRequest.deleteMany({});
  await User.deleteMany({});
  await Repository.deleteMany({});
  await Organization.deleteMany({});

  const issues = await generateIssues(100);
  const admins = await generateAdmins(4);
  const pullRequests = await generatePullRequests(50);
  const users = await generateUsers(100);
  const repositories = await generateRepositories(20);
  const organizations = await generateOrganizations(10);

  await Issue.insertMany(issues);
  await Admin.insertMany(admins);
  await PullRequest.insertMany(pullRequests);
  await User.insertMany(users);
  await Repository.insertMany(repositories);
  await Organization.insertMany(organizations);

  logger.info('Database seeded');
  mongoose.connection.close();
};

seedDatabase().catch((err) => {
  logger.error(err);
  mongoose.connection.close();
});
