import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as path from "path";
import { CfnAccessKey } from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { LambdaIntegration } from "@aws-cdk/aws-apigateway";
import * as lambdaNodeJs from "@aws-cdk/aws-lambda-nodejs";
import * as assets from "@aws-cdk/aws-s3-assets";
export type TPasslessServer = {
  api: apigateway.RestApi;
};
/**
 * This is the stack for our passwordless sever
 * It consists of
 * - API Gateway : Amazon API Gateway is a fully managed service that makes it easy for developers to publish,
 *      maintain, monitor, and secure APIs at any scale.
 * - Lambda functions :
 * - DynamoDB + DAX for persisting publicKey
 *
 * For examples
 * - https://bobbyhadz.com/blog/aws-cdk-api-gateway-example
 */
export default function buildPasslessServer(
  scope: cdk.Construct
): TPasslessServer {
  const api = new apigateway.RestApi(scope, "PasswordlessServer", {
    description:
      "This API allow us to expose passwordless server functions to Clients and to Cognito",
    deployOptions: {
      stageName: "v1",
    },
    // Enable CORS
    defaultCorsPreflightOptions: {
      allowHeaders: [
        "X-Custom-Header",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        ...apigateway.Cors.DEFAULT_HEADERS,
      ],
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ["GET", "POST"],
    },
  });

  /**
   * Function to initialise sign up process
   * when user hits /signup/init, this function is called
   */
  // const myLambdaAsset = new assets.Asset(scope, "lambda.zip", {
  //   path: path.join(__dirname, "..", "..", "lambda", "myLambdaFunction"),
  // });

  // const myLambdaFunction = new lambda.Function(this, "myLambdaFunction", {
  //   code: lambda.Code.fromBucket(
  //     myLambdaAsset.bucket,
  //     myLambdaAsset.s3ObjectKey
  //   ),
  //   runtime: lambda.Runtime.NODEJS_12_X,
  //   handler: "index.handler",
  // });
  const fnInitSignUp = new lambda.Function(scope, "initSignUp", {
    functionName: "passless-server-initSignUp",
    runtime: lambda.Runtime.NODEJS_14_X,
    code: lambda.Code.fromAsset(
      path.join(__dirname + "/../lambda-handlers/passless-server")
    ),
    handler: "initSignUp.handler",
    insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
  });
  const rInitSignUp = api.root.addResource("signup-init"); // Resource's path part only allow [a-zA-Z0-9._-], an optional trailing '+' and curly braces at the beginning and the end
  rInitSignUp.addMethod(
    "POST",
    new apigateway.LambdaIntegration(fnInitSignUp, {
      proxy: true,
      allowTestInvoke: true,
    })
  );
  rInitSignUp.addMethod(
    "GET",
    new apigateway.LambdaIntegration(fnInitSignUp, {
      proxy: true,
      allowTestInvoke: true,
    })
  );
  const server: TPasslessServer = {
    api: api,
  };

  new cdk.CfnOutput(scope, "API GATEWAY URL", {
    value: api.url,
  });
  return server;
}
