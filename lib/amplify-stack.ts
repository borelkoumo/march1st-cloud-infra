import * as cdk from "@aws-cdk/core";
import * as amplify from "@aws-cdk/aws-amplify";
import * as iam from "@aws-cdk/aws-iam";

export default class AmplifyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Create a role for Amplify App
    // Normally we should'nt. But i noticed a problem with trust relationship configuration
    // So it's necesary to change service endpoint in your trust policy from "amplify.amazonaws.com" to "amplify.<your-region>.amazonaws.com"
    const role = new iam.Role(this, "March1stAmplifyRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess-Amplify")
    );

    const app = new amplify.App(this, "March1st", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: "borelkoumo",
        repository: "march1st-frontend",
        // aws secretsmanager create-secret --name GITHUB_ACCESS_TOKEN --secret-string "<my-token-from-github>"
        oauthToken: cdk.SecretValue.secretsManager("GITHUB_ACCESS_TOKEN"),
      }),
      autoBranchCreation: {
        // Automatically connect branches that match "test/*"
        // We'll use it in Feature branch workflow
        patterns: ["main", "test/*"],
      },
      autoBranchDeletion: true,
    });
    app.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    /**
     * Redirection rules
     * When working with a single page application (SPA), use the CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT
     * to set up a 200 rewrite for all files to index.html except for the following file extensions:
     * css, gif, ico, jpg, js, png, txt, svg, woff, ttf, map, json, webmanifest.
     **/
    app.addCustomRule(amplify.CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT);

    // Add a domain and map sub domains to branches:
    const mainBranch = app.addBranch("main", {
      branchName: "main", // `main` will be used as repo branch name
      autoBuild: true,
    });

    const domain = app.addDomain("march1st.com", {
      enableAutoSubdomain: true, // in case subdomains should be auto registered for branches
      autoSubdomainCreationPatterns: ["main", "test*"], // regex for branches that should auto register subdomains
      // subDomains: [
      //   {
      //     branch: mainBranch,
      //   },
      //   {
      //     branch: mainBranch,
      //     // Main branch will have as domain name https://frontend.march1st-beta.com
      //     prefix: "www",
      //   },
      // ],
    });

    domain.mapRoot(mainBranch); // map master branch to domain root
    domain.mapSubDomain(mainBranch, "www");

    // Output info
    new cdk.CfnOutput(this, "App ID", {
      value: app.appId,
    });
    new cdk.CfnOutput(this, "Domain name", {
      value: domain.domainName,
    });
    new cdk.CfnOutput(this, "Main branch name", {
      value: mainBranch.branchName,
    });
    new cdk.CfnOutput(this, "App Default domain", {
      value: app.defaultDomain,
    });
  }
}
