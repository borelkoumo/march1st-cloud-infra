import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";

export default class CognitoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createClientUserPool();
    this.createHackerUserPool();
  }

  createClientUserPool() {
    /**
     * Creating user pool
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cognito-readme.html
     */
    const userPool = new cognito.UserPool(this, "March1stClientUserPool", {
      userPoolName: "march1st-client-user-pool",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // By default, self sign up is disabled.
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      userVerification: {
        emailSubject: "Verify your email for March1st",
        emailBody:
          "Thanks for signing up to March1st app! Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      standardAttributes: {
        fullname: {
          required: true,
          mutable: true,
        },
        email: {
          required: true,
          mutable: false,
        },
        locale: {
          // 'en-US': 'English (United States)',
          // 'ar-AE': 'Arabic (U.A.E.)',
          // Full list : https://gist.github.com/msikma/8912e62ed866778ff8cd#file-rfc5646-language-tags-js
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        companyName: new cognito.StringAttribute({
          mutable: true,
        }),
        title: new cognito.StringAttribute({
          mutable: true,
        }),
        userId: new cognito.StringAttribute({
          mutable: false,
        }),
        joinedOn: new cognito.StringAttribute({
          mutable: false,
        }),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        // Attributes which Cognito will look to verify automatically upon user sign up.
        // EMAIL and PHONE are the only available options.
        email: true,
      },
    });

    /**
     * Adding Lambda triggers for custom auth challenge
     * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html
     * - Lambda functions can be configured to use CloudWatch Lambda Insights
     * which provides low-level runtime metrics for a Lambda functions.
     * - A dead-letter queue can be automatically created for a Lambda function
     * by setting the deadLetterQueueEnabled: true configuration.
     */
    /**
     * This trigger is invoked when a user submits their information to sign up,
     * allowing you to perform custom validation to accept or deny the sign up request.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      new lambda.Function(this, "preSignUp", {
        functionName: "preSignUp",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "preSignUp.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
      })
    );
    /**
     * This trigger is invoked to initiate the custom authentication flow.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.DEFINE_AUTH_CHALLENGE,
      new lambda.Function(this, "defineAuthChallenge", {
        functionName: "defineAuthChallenge",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "defineAuthChallenge.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
      })
    );
    /**
     * This trigger is invoked after 'Define Auth Challenge',
     * if a custom challenge has been specified as part of the 'Define Auth Challenge' trigger.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.CREATE_AUTH_CHALLENGE,
      new lambda.Function(this, "createAuthChallenge", {
        functionName: "createAuthChallenge",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "createAuthChallenge.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
      })
    );
    /**
     * This trigger is invoked to verify if the response from the end user,
     *  for a custom authentication challenge is valid or not.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
      new lambda.Function(this, "verifyAuthChallengeResponse", {
        functionName: "verifyAuthChallengeResponse",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "verifyAuthChallengeResponse.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
      })
    );
    /**
     * Add an app client
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cognito-readme.html#app-clients
     * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html
     * You can create multiple apps for a user pool. Generally an app corresponds to the platform of an app.
     * For example, you might create an app for a server-side application and a different Android app.
     * Each app has its own app client ID.
     */

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "March1stClientWebAppClient",
      {
        userPoolClientName: "march1st-client-webapp-client",
        generateSecret: false,
        userPool: userPool,
        preventUserExistenceErrors: true,
        authFlows: {
          custom: true,
          userPassword: false,
          userSrp: false,
          adminUserPassword: false,
        },
      }
    );
    /**
     * Create identity pool
     * https://stackoverflow.com/questions/55784746/how-to-create-cognito-identitypool-with-cognito-userpool-as-one-of-the-authentic
     */
    const identityPool = new cognito.CfnIdentityPool(
      this,
      "March1stClientWebAppIdentityPool",
      {
        identityPoolName: "march1st-client-webapp-identity-pool",
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      }
    );

    const authenticatedRole = new iam.Role(
      this,
      "CognitoClientDefaultAuthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    const unauthenticatedRole = new iam.Role(
      this,
      "CognitoClientDefaultUnauthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["mobileanalytics:PutEvents", "cognito-sync:*"],
        resources: ["*"],
      })
    );
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
          "s3:*",
        ],
        resources: ["*"],
      })
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, "DefaultValid", {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
        authenticated: authenticatedRole.roleArn,
      },
    });

    // Output info
    new cdk.CfnOutput(this, "Client -- UserPool ID", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "Client -- UserPoolClient ID", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "Client -- IdentityPool ID", {
      value: identityPool.ref,
    });
  }

  createHackerUserPool() {
    /**
     * Creating user pool
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cognito-readme.html
     */
    const userPool = new cognito.UserPool(this, "March1stHackerUserPool", {
      userPoolName: "march1st-hacker-user-pool",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // By default, self sign up is disabled.
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        preferredUsername: true,
      },
      userVerification: {
        emailSubject: "Verify your email for March1st",
        emailBody:
          "Thanks for signing up to March1st app! Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      standardAttributes: {
        preferredUsername: {
          required: true,
          mutable: true,
        },
        email: {
          required: true,
          mutable: true,
        },
        locale: {
          // 'en-US': 'English (United States)',
          // 'ar-AE': 'Arabic (U.A.E.)',
          // Full list : https://gist.github.com/msikma/8912e62ed866778ff8cd#file-rfc5646-language-tags-js
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        userId: new cognito.StringAttribute({
          mutable: false,
        }),
        joinedOn: new cognito.StringAttribute({
          mutable: false,
        }),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        // Attributes which Cognito will look to verify automatically upon user sign up.
        // EMAIL and PHONE are the only available options.
        email: true,
      },
    });

    /**
     * Adding Lambda triggers for custom auth challenge
     * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html
     * - Lambda functions can be configured to use CloudWatch Lambda Insights
     * which provides low-level runtime metrics for a Lambda functions.
     * - A dead-letter queue can be automatically created for a Lambda function
     * by setting the deadLetterQueueEnabled: true configuration.
     */
    /**
     * This trigger is invoked when a user submits their information to sign up,
     * allowing you to perform custom validation to accept or deny the sign up request.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      new lambda.Function(this, "preSignUpHacker", {
        functionName: "preSignUpHacker",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "preSignUp.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
        environment: {
          typeUser: "hacker",
        },
      })
    );
    /**
     * This trigger is invoked to initiate the custom authentication flow.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.DEFINE_AUTH_CHALLENGE,
      new lambda.Function(this, "defineAuthChallengeHacker", {
        functionName: "defineAuthChallengeHacker",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "defineAuthChallenge.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
        environment: {
          typeUser: "hacker",
        },
      })
    );
    /**
     * This trigger is invoked after 'Define Auth Challenge',
     * if a custom challenge has been specified as part of the 'Define Auth Challenge' trigger.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.CREATE_AUTH_CHALLENGE,
      new lambda.Function(this, "createAuthChallengeHacker", {
        functionName: "createAuthChallengeHacker",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "createAuthChallenge.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
        environment: {
          typeUser: "hacker",
        },
      })
    );
    /**
     * This trigger is invoked to verify if the response from the end user,
     *  for a custom authentication challenge is valid or not.
     */
    userPool.addTrigger(
      cognito.UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
      new lambda.Function(this, "verifyAuthChallengeResponseHacker", {
        functionName: "verifyAuthChallengeResponseHacker",
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-handlers")),
        handler: "verifyAuthChallengeResponse.handler",
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        deadLetterQueueEnabled: true,
        timeout: cdk.Duration.minutes(1),
        environment: {
          typeUser: "hacker",
        },
      })
    );
    /**
     * Add an app client
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cognito-readme.html#app-clients
     * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html
     * You can create multiple apps for a user pool. Generally an app corresponds to the platform of an app.
     * For example, you might create an app for a server-side application and a different Android app.
     * Each app has its own app client ID.
     */

    const userPoolClientForHacker = new cognito.UserPoolClient(
      this,
      "March1stHackerWebApp",
      {
        userPoolClientName: "march1st-hacker-webapp",
        generateSecret: false,
        userPool: userPool,
        preventUserExistenceErrors: true,
        authFlows: {
          custom: true,
          userPassword: false,
          userSrp: false,
          adminUserPassword: false,
        },
      }
    );
    /**
     * Create identity pool
     * https://stackoverflow.com/questions/55784746/how-to-create-cognito-identitypool-with-cognito-userpool-as-one-of-the-authentic
     */
    const identityPool = new cognito.CfnIdentityPool(
      this,
      "March1stHackerWebAppIdentityPool",
      {
        identityPoolName: "march1st-hacker-webapp-identity-pool",
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClientForHacker.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      }
    );

    const authenticatedRole = new iam.Role(
      this,
      "CognitoHackerDefaultAuthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    const unauthenticatedRole = new iam.Role(
      this,
      "CognitoHackerDefaultUnauthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["mobileanalytics:PutEvents", "cognito-sync:*"],
        resources: ["*"],
      })
    );
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
          "s3:*",
        ],
        resources: ["*"],
      })
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, "DefaultValidHacker", {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
        authenticated: authenticatedRole.roleArn,
      },
    });

    // Output info
    new cdk.CfnOutput(this, "Hacker -- UserPool ID", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "Hacker -- UserPoolClient ID", {
      value: userPoolClientForHacker.userPoolClientId,
    });
    new cdk.CfnOutput(this, "Hacker -- IdentityPool ID", {
      value: identityPool.ref,
    });
  }
}
