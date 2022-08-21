// https://www.adobe.io/apis/documentcloud/sign/docs.html#!adobedocs/adobe-sign/master/webhooks/howto_aws.md
exports.handler = function index(event, context, callback) {
  // Fetch client id
  var clientid = event.headers["X-AdobeSign-ClientId"];

  //Validate it
  if (clientid == "BGBQIIE7H253K6") {
    //Replace 'BGBQIIE7H253K6' with the client id of the application using which the webhook is created
    var response = {
      statusCode: 200,
      headers: {
        "X-AdobeSign-ClientId": clientid,
      },
    };
    callback(null, response);
  } else {
    callback("Oops!! illegitimate call");
  }
};


