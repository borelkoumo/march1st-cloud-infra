// Create client outside of handler to reuse
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

exports.handler = (event, context, callback) => {
  console.log("###### initSignUp called");
  console.log("###### ENVIRONEMENT VARIABLES " + stringify(process.env));
  console.log(`###### CONTEXT = ${stringify(context, 2)}`);
  console.log(`###### EVENT = ${stringify(event, 2)}`);
  const body = JSON.parse(event.body);
  const resp = {
    publicKeyCredentialCreationOptions: {
      challenge:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      rp: {
        name: "Passless APP",
        id: "localhost",
      },
      user: {
        id: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        name: body.username,
        displayName: body.fullName,
      },
      attestation: "direct",
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, //"ES256" IANA COSE Algorithms registry
        { type: "public-key", alg: -257 }, // "RS256" IANA COSE Algorithms registry
      ],
    },
    misc: body,
  };
  return callback(null, formatResponse(stringify(resp)));
};

const formatResponse = function (body) {
  var resp = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
    },
    isBase64Encoded: false,
    multiValueHeaders: { "X-Custom-Header": ["Value1", "Value2"] },
    body: body,
  };
  return resp;
};

function stringify(object, offset = 0) {
  return JSON.stringify(object, null, offset);
}

// {
//     "key1": "data1",
//     "key2": "data2",
//     "event": {
//         "resource": "/signup-init",
//         "path": "/signup-init",
//         "httpMethod": "POST",
//         "headers": {
//             "Accept": "*/*",
//             "Accept-Encoding": "gzip, deflate, br",
//             "CloudFront-Forwarded-Proto": "https",
//             "CloudFront-Is-Desktop-Viewer": "true",
//             "CloudFront-Is-Mobile-Viewer": "false",
//             "CloudFront-Is-SmartTV-Viewer": "false",
//             "CloudFront-Is-Tablet-Viewer": "false",
//             "CloudFront-Viewer-Country": "PL",
//             "Content-Type": "application/json",
//             "Host": "6lnymbzvpa.execute-api.us-east-1.amazonaws.com",
//             "Postman-Token": "6f733a10-d9a3-4634-9969-cc686c3a9fa4",
//             "User-Agent": "PostmanRuntime/7.28.4",
//             "Via": "1.1 033b4b0cfe185be090def702a6a129aa.cloudfront.net (CloudFront)",
//             "X-Amz-Cf-Id": "NMr43wNFob9lNBsuNPbnuJr7QQGRBGc-BHkB5HMF57ky6T6hE8rN8w==",
//             "X-Amzn-Trace-Id": "Root=1-614b91c1-340a530c617a5a2c1c978e7e",
//             "X-Custom-Header": "My custom header",
//             "X-Forwarded-For": "37.225.87.64, 54.239.171.45",
//             "X-Forwarded-Port": "443",
//             "X-Forwarded-Proto": "https"
//         },
//         "multiValueHeaders": {
//             "Accept": [
//                 "*/*"
//             ],
//             "Accept-Encoding": [
//                 "gzip, deflate, br"
//             ],
//             "CloudFront-Forwarded-Proto": [
//                 "https"
//             ],
//             "CloudFront-Is-Desktop-Viewer": [
//                 "true"
//             ],
//             "CloudFront-Is-Mobile-Viewer": [
//                 "false"
//             ],
//             "CloudFront-Is-SmartTV-Viewer": [
//                 "false"
//             ],
//             "CloudFront-Is-Tablet-Viewer": [
//                 "false"
//             ],
//             "CloudFront-Viewer-Country": [
//                 "PL"
//             ],
//             "Content-Type": [
//                 "application/json"
//             ],
//             "Host": [
//                 "6lnymbzvpa.execute-api.us-east-1.amazonaws.com"
//             ],
//             "Postman-Token": [
//                 "6f733a10-d9a3-4634-9969-cc686c3a9fa4"
//             ],
//             "User-Agent": [
//                 "PostmanRuntime/7.28.4"
//             ],
//             "Via": [
//                 "1.1 033b4b0cfe185be090def702a6a129aa.cloudfront.net (CloudFront)"
//             ],
//             "X-Amz-Cf-Id": [
//                 "NMr43wNFob9lNBsuNPbnuJr7QQGRBGc-BHkB5HMF57ky6T6hE8rN8w=="
//             ],
//             "X-Amzn-Trace-Id": [
//                 "Root=1-614b91c1-340a530c617a5a2c1c978e7e"
//             ],
//             "X-Custom-Header": [
//                 "My custom header"
//             ],
//             "X-Forwarded-For": [
//                 "37.225.87.64, 54.239.171.45"
//             ],
//             "X-Forwarded-Port": [
//                 "443"
//             ],
//             "X-Forwarded-Proto": [
//                 "https"
//             ]
//         },
//         "queryStringParameters": null,
//         "multiValueQueryStringParameters": null,
//         "pathParameters": null,
//         "stageVariables": null,
//         "requestContext": {
//             "resourceId": "renxbp",
//             "resourcePath": "/signup-init",
//             "httpMethod": "POST",
//             "extendedRequestId": "GFO2QEFRoAMF8Fw=",
//             "requestTime": "22/Sep/2021:20:27:45 +0000",
//             "path": "/v1/signup-init",
//             "accountId": "917875368816",
//             "protocol": "HTTP/1.1",
//             "stage": "v1",
//             "domainPrefix": "6lnymbzvpa",
//             "requestTimeEpoch": 1632342465415,
//             "requestId": "cdf6cf97-8262-46c2-95de-9183dc75ac14",
//             "identity": {
//                 "cognitoIdentityPoolId": null,
//                 "accountId": null,
//                 "cognitoIdentityId": null,
//                 "caller": null,
//                 "sourceIp": "37.225.87.64",
//                 "principalOrgId": null,
//                 "accessKey": null,
//                 "cognitoAuthenticationType": null,
//                 "cognitoAuthenticationProvider": null,
//                 "userArn": null,
//                 "userAgent": "PostmanRuntime/7.28.4",
//                 "user": null
//             },
//             "domainName": "6lnymbzvpa.execute-api.us-east-1.amazonaws.com",
//             "apiId": "6lnymbzvpa"
//         },
//         "body": "{\r\n\"username\": \"borel\",\r\n\"email\": \"borelkoumo@gmail.com\",\r\n\"fullName\": \"Borel KOUMO\"\r\n}",
//         "isBase64Encoded": false
//     }
// }
