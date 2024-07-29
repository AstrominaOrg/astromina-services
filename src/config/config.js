const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_ACCESS_EXPIRATION_MINUTES_ADMIN: Joi.number()
      .default(180)
      .description('minutes after which access tokens expire for admin'),
    JWT_REFRESH_EXPIRATION_MINUTES_ADMIN: Joi.number()
      .default(0)
      .description('minutes after which refresh tokens expire for admin'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    DISCORD_TOKEN: Joi.string().description('Discord bot token'),
    DISCORD_OAUTH_CLIENT_ID: Joi.string().description('Discord OAuth client ID'),
    DISCORD_OAUTH_CLIENT_SECRET: Joi.string().description('Discord OAuth client secret'),
    DISCORD_CHANNEL_ID: Joi.string().description('Discord channel ID'),
    GITHUB_CLIENT_ID: Joi.string().description('GitHub client ID'),
    GITHUB_CLIENT_SECRET: Joi.string().description('GitHub client secret'),
    GITHUB_PRIVATE_KEY: Joi.string().description('GitHub app private key'),
    GITHUB_APP_ID: Joi.string().description('GitHub app ID'),
    GITHUB_CALLBACK_URL: Joi.string().description('GitHub app callback URL'),
    GITHUB_JWT: Joi.string().description('GitHub app JWT'),
    GITHUB_OAUTH_CLIENT_ID: Joi.string().description('GitHub OAuth client ID'),
    GITHUB_OAUTH_CLIENT_SECRET: Joi.string().description('GitHub OAuth client secret'),
    GITHUB_APP_INSTALLATION_ID: Joi.string().description('GitHub app installation ID'),
    GITHUB_PORT: Joi.number().default(3000).description('Github port'),
    SESSION_SECRET: Joi.string().required().description('Session secret key'),
    FRONTEND_URL: Joi.string().description('Frontend URL'),
    REDIS_HOST: Joi.string().description('Redis host'),
    REDIS_PORT: Joi.number().description('Redis port'),
    OTP_LENGTH: Joi.number().default(6).description('OTP length'),
    OTP_PERIOD: Joi.number().default(300).description('OTP period in seconds'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,
  redirectUrl: envVars.REDIRECT_URL,
  mongoose: {
    url: `mongodb://${envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : '')}`,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    },
  },
  otp: {
    length: envVars.OTP_LENGTH,
    period: envVars.OTP_PERIOD,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    accessExpirationMinutesAdmin: envVars.JWT_ACCESS_EXPIRATION_MINUTES_ADMIN,
    refreshExpirationMinutesAdmin: envVars.JWT_REFRESH_EXPIRATION_MINUTES_ADMIN,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  session: {
    secret: envVars.SESSION_SECRET,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
  },
  discord: {
    token: envVars.DISCORD_TOKEN,
    oauthClientId: envVars.DISCORD_OAUTH_CLIENT_ID,
    oauthClientSecret: envVars.DISCORD_OAUTH_CLIENT_SECRET,
    channelId: envVars.DISCORD_CHANNEL_ID,
  },
  github: {
    clientId: envVars.GITHUB_CLIENT_ID,
    clientSecret: envVars.GITHUB_CLIENT_SECRET,
    oauthClientId: envVars.GITHUB_OAUTH_CLIENT_ID,
    oauthClientSecret: envVars.GITHUB_OAUTH_CLIENT_SECRET,
    webhookProxyUrl: envVars.GITHUB_WEBHOOK_PROXY_URL,
    webhookSecret: envVars.GITHUB_WEBHOOK_SECRET,
    webhookPath: envVars.GITHUB_WEBHOOK_PATH,
    privateKey: envVars.PRIVATE_KEY,
    appId: envVars.APP_ID,
    port: envVars.GITHUB_PORT,
    appInstallationId: envVars.GITHUB_APP_INSTALLATION_ID,
    callbackUrl: envVars.GITHUB_CALLBACK_URL,
    jwt: envVars.GITHUB_JWT,
  },
};
