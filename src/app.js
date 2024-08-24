const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SmeeClient = require('smee-client');
const { createNodeMiddleware, Probot } = require('probot');
const config = require('./config/config');
const routes = require('./routes/v1');
const morgan = require('./config/morgan');
const { jwtStrategy, githubStrategy, discordStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const gitbot = require('./gitbot');

if (config.env === 'development') {
  const smee = new SmeeClient({
    source: config.github.webhookProxyUrl,
    target: `http://localhost:${config.port}${config.github.webhookPath}`,
  });

  smee.start();
}

const probot = new Probot({
  appId: config.github.appId,
  privateKey: config.github.privateKey,
  secret: config.github.webhookSecret,
});

const probotMiddleware = createNodeMiddleware(gitbot, { probot });

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());
app.use(cookieParser());

// set secure attribute for cookies
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(probotMiddleware);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(
  cors({
    origin: [config.frontendUrl, config.frontendUrlDev],
    credentials: true,
  })
);

app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);
passport.use(githubStrategy);
passport.use(discordStrategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
