#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import AmplifyStack from "../lib/amplify-stack";
// import AmplifyMobileStack from "../lib/amplify-mobile-stack";
import CognitoStack from "../lib/cognito-stack";
import DynamoDBStack from "../lib/dynamodb-stack";
import VPCStack from "../lib/vpc-stack";

const app = new cdk.App();
const env = {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // account: "917875368816",
  // account: "482582546554",
  account: "297384550932",
  region: "us-east-1",
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
};

new VPCStack(app, "VPCStack", {
  stackName: "VPCStack",
  env: env,
});

new AmplifyStack(app, "AmplifyStack", {
  stackName: "AmplifyStack",
  env: env,
});

new CognitoStack(app, "CognitoStack", {
  stackName: "CognitoStack",
  env: env,
});

new DynamoDBStack(app, "DynamoDBStack", {
  stackName: "DynamoDBStack",
  env: env,
});


// new AmplifyMobileStack(app, "AmplifyMobileStack", {
//   stackName: "AmplifyMobileStack",
//   env: env,
// });