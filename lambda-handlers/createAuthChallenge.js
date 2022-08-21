/**
 * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-create-auth-challenge.html
 */
const logger = require("./helpers/logger");
const axios = require("./helpers/axios");

exports.handler = (event, context, callback) => {
  logger.printLog("##### createAuthChallenge handler");
  logger.printLog("Event", event);
  logger.printLog("Context", context);

  if (event.request.userNotFound) {
    logger.printLog("User does not exist");
    callback(`User doesn't exist`, event);
  }

  // If it's custom challenge, then get user attributes
  // const username = event.userName;
  const username = event.request.userAttributes.email;
  const data = {
    username: username,
  };
  let requestFailed = false;
  let requestFailedMessage = "";

  // Make a request for a user with a given ID
  axios.instance
    .post("/assertion/options", data)
    .then(function (response) {
      logger.printLog("response.data", response.data);
      logger.printLog("response.status", response.status);
      logger.printLog("response.statusText", response.statusText);
      logger.printLog("response.headers", response.headers);
      logger.printLog("response.config", response.config);
      /**
       * PUBIC AND PRIVATE CHALLENGE PARAMETERS
       */
      let publicChallengeParameters = {};
      let privateChallengeParameters = {};

      const attestationOptions = response.data.data;
      logger.printLog("attestationOptions", attestationOptions);

      // Public hallenge parameters
      publicChallengeParameters = {
        challenge: attestationOptions.challenge,
        timeout: attestationOptions.timeout,
        rpId: attestationOptions.rpId,
        allowCredentials: JSON.stringify(attestationOptions.allowCredentials),
        userVerification: attestationOptions.userVerification,
        sessionId: attestationOptions.sessionId,
        extensions: JSON.stringify(attestationOptions.extensions),
        username: username,
      };

      // Private challenge parameters
      privateChallengeParameters = {
        sessionId: attestationOptions.sessionId,
        extensions: JSON.stringify(attestationOptions.extensions),
      };

      // Set response fields
      event.response.publicChallengeParameters = publicChallengeParameters;
      event.response.privateChallengeParameters = privateChallengeParameters;
    })
    .catch(function (error) {
      /**
       * AN ERROR OCURED
       */
      requestFailed = true;
      logger.printLog("Error catched", error);
      if (error.response) {
        /**
         * The request was made and the server responded with a status code
         * that falls out of the range of 2xx
         */
        requestFailedMessage =
          error + ". Infos : (" + error.response.data.message + ")";
        // Print logs to CloudWatch Logs
        logger.printLog("error.response.data", error.response.data);
        logger.printLog("error.response.status", error.response.status);
        logger.printLog(
          "error.response.data.message",
          error.response.data.message
        );
        logger.printLog("error.response.headers", error.response.headers);
      } else if (error.request) {
        /**
         * The request was made but no response was received
         * `error.request` is an instance of XMLHttpRequest in the browser and an instance of
         * http.ClientRequest in node.js
         */
        requestFailedMessage =
          "The request was made but no response was received";
        // Print logs to CloudWatch Logs
        logger.printLog("error.request", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        requestFailedMessage =
          "Something happened in setting up the request that triggered an Error (" +
          error.message +
          ")";
        // Print logs to CloudWatch Logs
        logger.printLog(
          "Something happened in setting up the request that triggered an Error",
          error.message
        );
      }
    })
    .then(function () {
      /**
       * This is always executed by Axios
       * */
      if (requestFailed) {
        callback(requestFailedMessage, event);
      } else {
        callback(null, event);
      }
    });
};
