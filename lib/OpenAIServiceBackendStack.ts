import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class OpenAIServiceBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaExecutionRole = this.createLambdaExecutionRole();
    const lambdaFct = this.createNodejsFunction(lambdaExecutionRole);

    const apiName = 'OpenAiRestApi';
    const api = new LambdaRestApi(scope, apiName, {
      restApiName: apiName,
      description:
        'used to provide access to the backend to encapsulate the chatgpt token',
      handler: lambdaFct,
    });
    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['execute-api:Invoke'],
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          resources: ['*'],
          conditions: {},
        }),
      ],
    });

    const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;
    cfnApi.addPropertyOverride('Policy', apiResourcePolicy);

    const endpointName = 'EndpointURL4OpenAiBackend';
    new ssm.StringParameter(scope, endpointName, {
      parameterName: endpointName,
      stringValue: api.url,
      description: `The URL for Lambda Gateway of openai backend.`,
    });
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
