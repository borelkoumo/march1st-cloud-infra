import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { CfnOutput } from "@aws-cdk/core";

export default class DynamoDBStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * DYNAMO DB TABLE
     */
    const table = new dynamodb.Table(this, "Table", {
      tableName: "Users",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    /** Some applications might need to perform many kinds of queries,
     * using a variety of different attributes as query criteria.
     * To support these requirements, you can create one or more global secondary indexes
     * and issue Query requests against these indexes in Amazon DynamoDB.
     *
     * */
    table.addGlobalSecondaryIndex({
      // the name of the global secondary index
      indexName: "username-index",
      // the partition key attribute for the global secondary index
      partitionKey: { name: "username", type: dynamodb.AttributeType.STRING },
      // which attributes should be projected into the global secondary index.
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new CfnOutput(this, "Table Name", {
      value: table.tableName,
    });
    // return table;
  }
}
