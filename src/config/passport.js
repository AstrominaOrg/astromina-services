const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { Strategy: DiscordStrategy } = require('passport-discord');

const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User, Admin } = require('../models');
const { createUser } = require('../services/user.service');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    let user;
    if (payload.admin) {
      user = await Admin.findById(payload.sub);
      user.role = 'admin';
    } else {
      user = await User.findById(payload.sub);
      user.role = 'user';
    }
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const githubStrategy = new GitHubStrategy(
  {
    clientID: config.github.oauthClientId,
    clientSecret: config.github.oauthClientSecret,
    callbackURL: config.github.callbackUrl,
    customHeaders: {
      'X-Github-Next-Global-ID': '1',
    },
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await createUser(profile);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
);

const discordStrategy = new DiscordStrategy(
  {
    clientID: config.discord.oauthClientId,
    clientSecret: config.discord.oauthClientSecret,
    callbackURL: config.discord.callbackUrl,
    scope: ['identify', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      return done(null, profile, { profile });
    } catch (error) {
      return done(error, false);
    }
  }
);

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
  githubStrategy,
  discordStrategy,
};
