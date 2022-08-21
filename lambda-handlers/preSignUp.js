/**
 * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-verify-auth-challenge-response.html
 */
const logger = require("./helpers/logger");
const key = process.env.KEY;

exports.handler = (event, context, callback) => {
  logger.printLog("##### preSignUp handler");
  logger.printLog("Event", event);
  logger.printLog("Context", context);
  logger.printLog("##### process.env.KEY = " + key);

  // Return to Amazon Cognito
  callback(null, event);
};
