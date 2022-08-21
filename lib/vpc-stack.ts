import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as route53 from "@aws-cdk/aws-route53";
import * as targets from "@aws-cdk/aws-route53-targets";

/**
 * IMPORT CLASSES
 */
import { CfnOutput } from "@aws-cdk/core";

export default class VPCStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * CREATE VPC
     */
    const vpc = new ec2.Vpc(this, `VPC-March1st`, {
      cidr: "11.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private-",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      natGateways: 1,
    });

    /**
     * ALB SG
     */
    // Create an application load balancer in a VPC. 'internetFacing' must be 'true'
    // for CloudFront to access the load balancer and use it as an origin.
    const albSG = new ec2.SecurityGroup(this, "ALB-SG", {
      vpc,
      securityGroupName: "ALB-SG",
      description: "Security Group for ALB",
    });
    albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
    // albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(8080));
    // albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(8081));
    //albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(443));
    //albSG.connections.allowToAnyIpv4(ec2.Port.allTcp());

    /**
     * ALB
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, "backend-alb", {
      loadBalancerName: "ALB",
      vpc,
      internetFacing: true,
      securityGroup: albSG,
    });
    alb.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    /**
     * TARGET GROUP
     */
    const tgRPBackend = new elbv2.ApplicationTargetGroup(
      this,
      "TG-RP-Backend",
      {
        targetGroupName: "TG-RP-Backend",
        targetType: elbv2.TargetType.INSTANCE,
        // Port for AdonisJS server
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
        healthCheck: {
          enabled: true, // Not sure it's already implemented
          path: "/rpbackend/health",
          port: "traffic-port",
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          healthyHttpCodes: "200-299",
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
          timeout: cdk.Duration.seconds(5),
        },
        vpc,
      }
    );
    const tgAuthServer = new elbv2.ApplicationTargetGroup(
      this,
      "TG-Auth-Server",
      {
        targetGroupName: "TG-Auth-Server",
        targetType: elbv2.TargetType.INSTANCE,
        // Port for AdonisJS server
        port: 8081,
        protocol: elbv2.ApplicationProtocol.HTTP,
        protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
        healthCheck: {
          enabled: true, // Not sure it's already implemented
          path: "/fido2/health",
          port: "traffic-port",
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          healthyHttpCodes: "200-299",
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
          timeout: cdk.Duration.seconds(5),
        },
        vpc,
      }
    );

    /**
     * ALB listener on port 443
     **/
    const httpsListener = alb.addListener("ALBListener", {
      port: 443,
      certificates: [
        elbv2.ListenerCertificate.fromArn(
          "arn:aws:acm:us-east-1:297384550932:certificate/ddbd70f0-847e-483a-b443-cab879f61424"
        ),
      ],
      defaultAction: elbv2.ListenerAction.forward([tgRPBackend]),
    });
    httpsListener.addTargetGroups("BackendServer", {
      targetGroups: [tgRPBackend],
      conditions: [elbv2.ListenerCondition.pathPatterns(["/rpbackend*"])],
      priority: 100, // The rule with the lowest priority will be used for every request.
    });
    httpsListener.addTargetGroups("AuthenticationServer", {
      targetGroups: [tgAuthServer],
      conditions: [elbv2.ListenerCondition.pathPatterns(["/fido2*"])],
      priority: 200, // The rule with the lowest priority will be used for every request.
    });

    /**
     * Route 53 record for ALB
     * */
    const zone = route53.HostedZone.fromLookup(this, "March1st-Zone", {
      domainName: "march1st.com",
    });
    new route53.ARecord(this, "March1st-Backend-Alias", {
      recordName: "backend.march1st.com",
      comment: "Alias record for March1st backend",
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
    });

    // Set properties
    this.vpc = vpc;
    this.alb = alb;

    // Output
    new CfnOutput(this, "VPC CIDR", {
      value: vpc.vpcCidrBlock,
    });

    for (let i = 1; i <= vpc.availabilityZones.length; i++) {
      new CfnOutput(this, `AZ ${i}`, {
        value: vpc.availabilityZones[i - 1],
      });
    }

    for (let i = 1; i <= vpc.publicSubnets.length; i++) {
      let sn = vpc.publicSubnets[i - 1];
      new CfnOutput(this, `Public Subnet ${i}`, {
        value: `${sn.subnetId} (${sn.ipv4CidrBlock})`,
      });
    }

    for (let i = 1; i <= vpc.privateSubnets.length; i++) {
      let sn = vpc.privateSubnets[i - 1];
      new CfnOutput(this, `Private Subnet ${i}`, {
        value: `${sn.subnetId} (${sn.ipv4CidrBlock})`,
      });
    }

    new CfnOutput(this, "ALB DNS", {
      value: alb.loadBalancerDnsName,
    });
  }
}
