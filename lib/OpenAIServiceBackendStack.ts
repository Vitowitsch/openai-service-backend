import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class OpenAIServiceBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaExecutionRole = this.createLambdaExecutionRole();
    this.createNodejsFunction(lambdaExecutionRole);
  }

  private createLambdaExecutionRole() {
    const lambdaExecutionRole = new iam.Role(
      this,
      `OpenAIServiceBackendLambdaExecutionRole`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      },
    );

    lambdaExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/*`],
      }),
    );

    return lambdaExecutionRole;
  }

  private createNodejsFunction(lambdaExecutionRole: iam.Role): NodejsFunction {
    return new NodejsFunction(this, `OpenAIServiceBackendLambda`, {
      entry: 'src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 8192,
      timeout: cdk.Duration.seconds(900),
      role: lambdaExecutionRole,

      environment: {
        REGION: this.region,
      },
      reservedConcurrentExecutions: 15,
    });
  }
}
