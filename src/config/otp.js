const otpGenerator = require('otp-generator');
const config = require('./config');

const oneTimePassword = {
  digits: config.otp.length,
  period: config.otp.period,
  generate: () => otpGenerator.generate(oneTimePassword.digits, { upperCase: false, specialChars: false }),
};

module.exports = oneTimePassword;
