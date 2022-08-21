const logger = require("./helpers/logger");
const axios = require("./helpers/axios");

exports.handler = (event, context, callback) => {
  logger.printLog("##### verifyAuthChallengeResponse handler");
  logger.printLog("Event", event);
  logger.printLog("Context", context);

  // Retrieve private challenge parameters
  const sessionId = event.request.privateChallengeParameters.sessionId;
  const extensions = JSON.parse(
    event.request.privateChallengeParameters.extensions
  );

  const e = {
    version: "1",
    region: "us-east-1",
    userPoolId: "us-east-1_FSAql8lxK",
    userName: "borelkoumo6",
    callerContext: {
      awsSdkVersion: "aws-sdk-unknown-unknown",
      clientId: "1g64ss3thoo57bubbq2aogutii",
    },
    triggerSource: "VerifyAuthChallengeResponse_Authentication",
    request: {
      userAttributes: {
        sub: "d721d182-3ace-4822-a9e0-8fc9cc260df1",
        "cognito:email_alias": "borelkoumo.cloud@gmail.com",
        "cognito:user_status": "CONFIRMED",
        email_verified: "true",
        name: "Borel KOUMO",
        preferred_username: "borelkoumo6",
        "custom:joinedOn": "2021-11-06",
        email: "borelkoumo.cloud@gmail.com",
      },
      privateChallengeParameters: {
        sessionId: "7f75ef52-eea4-4cc3-a5ad-e06742793d56",
        extensions: "{}",
      },
      challengeAnswer:
        '{"response":{"id":"AXXsfYZju1BRXAC-0SVIEk-9_5bCHMxAxsXx3iZSKiLRtciQoLW0ZOD6Jn284swht6t2Mu3lUT44zjMRnnY1i-o","type":"public-key","clientDataJSON":"eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWi1ZNGFlcWY0RFhYaDlFLXJ4OTdPSUtOWm9DNm5nZHJPZzBEeWp1YjF5TkVBel9sNDZodEF4QkxqUHo0YU1zM2hlV2dwSU5EdVdOMzlhMUlTc2g0VmciLCJvcmlnaW4iOiJodHRwczpcL1wvYXBwLm1hcmNoMXN0LWJldGEuY29tIiwiYW5kcm9pZFBhY2thZ2VOYW1lIjoiY29tLmFuZHJvaWQuY2hyb21lIn0","authenticatorData":"DjlNGmXwVe2Qu608_UouSRSN1WfuUaB1aYHrMFL3eRMFAAAABQ","signature":"MEQCIDXLaw8e4ew6WAv79XPG74alFrvrX6A_zbznXkzVS3AqAiA4F04xcKpq28-rILbA29ct1D5zBO5iiuJlkPYpF8tvNg"}}',
      userNotFound: false,
    },
    response: {
      answerCorrect: null,
    },
  };

  // Retreive challenge answer
  const challengeAnswerResponse = JSON.parse(
    event.request.challengeAnswer
  ).response;

  // Log challenge answer
  logger.printLog("challengeAnswerResponse", challengeAnswerResponse);

  // Assume answer is incorrect
  event.response.answerCorrect = false;

  // Check parameters
  if (!challengeAnswerResponse) {
    logger.printLog(`No challenge answer provided`);
    callback(`No challenge answer provided`, event);
  }

  // Destructurate challenge answer
  const {
    requestOrigin,
    id,
    type,
    clientDataJSON,
    authenticatorData,
    signature,
    userHandle,
  } = challengeAnswerResponse;

  // Request info
  const data = {
    requestOrigin: requestOrigin,
    id: id,
    type: type,
    sessionId: sessionId,
    clientDataJSON: clientDataJSON,
    authenticatorData: authenticatorData,
    signature: signature,
    userHandle: userHandle,
    extensions: extensions,
  };

  let requestFailed = false;
  let requestFailedMessage = "";

  // Make a request for a user with a given ID
  axios.instance
    .post("/assertion/result", data)
    .then(function (response) {
      logger.printLog("response.data", response.data);
      logger.printLog("response.status", response.status);
      logger.printLog("response.statusText", response.statusText);
      logger.printLog("response.headers", response.headers);
      logger.printLog("response.config", response.config);

      const result = response.data.data;
      logger.printLog("Assertion result", result);

      /**
       * {
       "serverResponse": {
         "description": "string",
         "internalError": "string",
         "internalErrorCode": 0,
         "internalErrorCodeDescription": "string"
        },
        "userId": "string",
        "userPresent": true,
        "userVerified": true
      }
      */
      if (result.userVerified) {
        // Ok. User can now log into account
        logger.printLog("User can now log into account");
        event.response.answerCorrect = true;
      } else {
        requestFailed = true;
        requestFailedMessage =
          "Unable to login. Invalid authentication signature provided.";
        logger.printLog(
          "Unable to login. Invalid authentication signature provided."
        );
      }
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
