const logger = require("./helpers/logger");
/**
 * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html
 */

exports.handler = (event, context, callback) => {
  logger.printLog("##### defineAuthChallenge handler");
  logger.printLog("Event", event);
  logger.printLog("Context", context);

  // If user is not registered
  if (event.request.userNotFound) {
    event.response.issueToken = false;
    event.response.failAuthentication = true;
    logger.printLog("User does not exist");
    throw new Error("User does not exist");
  }

  /**
   * session : an array of ChallengeResult elements, each of which contains challengeName, challengeResult and challengeMetadata
   * challengeName : The challenge type. One of:
   * - CUSTOM_CHALLENGE, SRP_A, PASSWORD_VERIFIER, SMS_MFA,
   * - DEVICE_SRP_AUTH, DEVICE_PASSWORD_VERIFIER, or ADMIN_NO_SRP_AUTH.
   * challengeResult : Set to true if the user successfully completed the challenge, or false otherwise.
   *  */

  if (
    event.request.session.length == 1 &&
    event.request.session[0].challengeName === "CUSTOM_CHALLENGE" &&
    event.request.session[0].challengeResult === true
  ) {
    // The user provided the right answer; succeed auth
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else {
    // It's the first time user try to login
    // Return challenge
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "CUSTOM_CHALLENGE";
  }

  // Return to Amazon Cognito
  callback(null, event);
};
